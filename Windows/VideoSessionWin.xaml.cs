using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using Newtonsoft.Json;
using System.Windows.Threading;
using System.IO;
using AxnpcloudroomvideosdkLib;
using System.Windows.Media.Imaging;
using System.Windows.Data;

namespace SDKDemo
{
    public class CCamInfo
    {
        public int ID;
        public string NAME;
        public CCamInfo(int id, string name)
        {
            this.ID = id;
            this.NAME = name;
        }
        public override string ToString()
        {
            return this.NAME;
        }
    }

    public class CAudioInfo
    {
        public string ID;
        public string NAME;
        public CAudioInfo(string id, string name)
        {
            this.ID = id;
            this.NAME = name;
        }
        public override string ToString()
        {
            return this.NAME;
        }
    } 


    public delegate void devChangeHandler();
    /// <summary>
    /// VideoSessionWin.xaml 的交互逻辑
    /// </summary>
    public partial class VideoSessionWin : Window
    {        
        private string mSessionID;
        private string mPeerUserId;
        private DispatcherTimer mTickTimer = new DispatcherTimer();
        private int mSessionTick;

        private RecordWin mRecordWin = null;
        private SendCmdWin mSendCmdWin = null;

        private VideoUI videoUI_peer = new VideoUI();
        private VideoUI videoUI_self = new VideoUI();
        public event devChangeHandler devChangeEvent;
        private enum DEVTYPE
        {
            VIDEO,
            AUDIO,
            ALL
        }

        private delegate void messageBoxDelegate(string desc);
        private void BeginInvokeMessageBox(string desc)
        {
            System.Windows.MessageBox.Show(this, desc);
        }

        public VideoSessionWin()
        {
            InitializeComponent();
            initDelegate(true);

            panel_left.Child = videoUI_peer;
            panel_right.Child = videoUI_self;

            mTickTimer.Interval = new TimeSpan(0, 0, 1);
            mTickTimer.Tick += Tick;
        }

        private void initDelegate(bool isInit)
        {
            if (isInit)
            {
                App.CRVideoCall.VideoSDK.netStateChanged += netStateChanged;
                App.CRVideoCall.VideoSDK.micEnergyUpdate += micEnergyUpdate;
                App.CRVideoCall.VideoSDK.audioDevChanged += audioDevChanged;
                App.CRVideoCall.VideoSDK.audioStatusChanged += audioStatusChanged;
                App.CRVideoCall.VideoSDK.videoDevChanged += videoDevChanged;
                App.CRVideoCall.VideoSDK.videoStatusChanged += videoStatusChanged;
                App.CRVideoCall.VideoSDK.startScreenShareRslt += startScreenShareRslt;
                App.CRVideoCall.VideoSDK.stopScreenShareRslt += stopScreenShareRslt;
                //App.CRVideoCall.Video.notifyVideoData +=  ICloudroomVideoSDKEvents_notifyVideoDataEventHandler(notifyVideoData);

                App.CRVideoCall.VideoSDK.sendFileRlst += sendFileRlst;
                App.CRVideoCall.VideoSDK.notifyFileData += notifyFileData;

                App.CRVideoCall.VideoSDK.cancelSendRlst += cancelSendRlst;
                App.CRVideoCall.VideoSDK.sendProgress += sendProgress;

                App.CRVideoCall.VideoSDK.sendCmdRlst += sendCmdRlst;
                App.CRVideoCall.VideoSDK.notifyCmdData += notifyCmdData;
            }
            else 
            {
                App.CRVideoCall.VideoSDK.netStateChanged -= netStateChanged;
                App.CRVideoCall.VideoSDK.micEnergyUpdate -= micEnergyUpdate;
                App.CRVideoCall.VideoSDK.audioDevChanged -= audioDevChanged;
                App.CRVideoCall.VideoSDK.audioStatusChanged -= audioStatusChanged;
                App.CRVideoCall.VideoSDK.videoDevChanged -= videoDevChanged;
                App.CRVideoCall.VideoSDK.videoStatusChanged -= videoStatusChanged;
                App.CRVideoCall.VideoSDK.startScreenShareRslt -= startScreenShareRslt;
                App.CRVideoCall.VideoSDK.stopScreenShareRslt -= stopScreenShareRslt;                
                //App.CRVideoCall.Video.notifyVideoData -= ICloudroomVideoSDKEvents_notifyVideoDataEventHandler(notifyVideoData);

                App.CRVideoCall.VideoSDK.sendFileRlst -= sendFileRlst;
                App.CRVideoCall.VideoSDK.notifyFileData -= notifyFileData;

                App.CRVideoCall.VideoSDK.cancelSendRlst -= cancelSendRlst;
                App.CRVideoCall.VideoSDK.sendProgress -= sendProgress;

                App.CRVideoCall.VideoSDK.sendCmdRlst -= sendCmdRlst;
                App.CRVideoCall.VideoSDK.notifyCmdData -= notifyCmdData;
            }
        }

        public void initSessionInfo(string peerUserID, string sessionID)
        {
            mSessionID = sessionID;
            mPeerUserId = peerUserID;
        }
        //登陆会话成功，初始化下相关设备
        public void initVideoSession()
        {
            initDevs(DEVTYPE.ALL);
            //设置视频尺寸            
            cmbVideoSize.SelectedIndex = (int)VIDEO_SHOW_SIZE.VSIZE_SZ_360;
            //打开设备
            btnCameraOpr.Content = "打开";
            App.CRVideoCall.VideoSDK.openVideo(Login.Instance.SelfUserId);
            btnMicOpr.Content = "打开";
            App.CRVideoCall.VideoSDK.openMic(Login.Instance.SelfUserId);

            updateVideoCfg();
            chkMute.IsChecked = false;

            videoUI_peer.UI.setVideo(mPeerUserId, -1); //显示对方视频
            videoUI_peer.UI.visibleNickName = 1;

            videoUI_self.UI.setVideo(Login.Instance.SelfUserId, -1); //显示自己视频
            videoUI_self.UI.visibleNickName = 1;

            mTickTimer.Start();
        }

        public void userEnterMeeting(string userID)
        {
            Console.WriteLine("userEnterMeeting:" + userID);

            videoUI_peer.UI.setVideo(mPeerUserId, -1); //显示对方视频
            videoUI_peer.UI.visibleNickName = 1;

            videoUI_self.UI.setVideo(Login.Instance.SelfUserId, -1); //显示自己视频
            videoUI_self.UI.visibleNickName = 1;
        }

        public void netStateChanged(object sender, ICloudroomVideoSDKEvents_netStateChangedEvent e)
        {
            netStateBar.Value = e.p_level;
        }

        public void micEnergyUpdate(object sender, ICloudroomVideoSDKEvents_micEnergyUpdateEvent e)
        {
            if (e.p_userID == Login.Instance.SelfUserId)
            {
                micEnergy.Value = e.p_newLevel;
            }            
        }

        public void audioDevChanged(object sender, EventArgs e)
        {
            initDevs(DEVTYPE.AUDIO);
        }

        public void audioStatusChanged(object sender, ICloudroomVideoSDKEvents_audioStatusChangedEvent e)
        {
            Console.WriteLine("audio StatusChanged:" + e.p_oldStatus + "->" + e.p_newStatus);
            if (e.p_userID == mPeerUserId)
                return;

            if (e.p_newStatus <= 2)
            {
                btnMicOpr.Content = "打开";
            }
            else
            {
                btnMicOpr.Content = "关闭";
            }
        }

        public void videoDevChanged(object sender, ICloudroomVideoSDKEvents_videoDevChangedEvent e)
        {
            if (e.p_userID == Login.Instance.SelfUserId)
            {
                initDevs(DEVTYPE.VIDEO);
            }
            //设备发生变化，重新添加视频UI数据源
            videoUI_peer.UI.setVideo(mPeerUserId, -1); //显示对方视频
            videoUI_peer.UI.visibleNickName = 1;

            videoUI_self.UI.setVideo(Login.Instance.SelfUserId, -1); //显示自己视频
            videoUI_self.UI.visibleNickName = 1;
            if(mRecordWin != null)
                devChangeEvent();
        }

        public void videoStatusChanged(object sender, ICloudroomVideoSDKEvents_videoStatusChangedEvent e)
        {
            Console.WriteLine("video StatusChanged:" + e.p_oldStatus + "->" + e.p_newStatus);
            if (mRecordWin != null)
                devChangeEvent();

            if (e.p_userID == mPeerUserId)
                return;

            if (e.p_newStatus <= 2)
            {
                btnCameraOpr.Content = "打开";
            }
            else
            {
                btnCameraOpr.Content = "关闭";
            }
        }

        private void initDevs(DEVTYPE type)
        {
            cmbMics.IsEnabled = false;
            cmbSpeakers.IsEnabled = false;
            cmbCameras.IsEnabled = false;

            //获取麦克风和扬声器设备
            if (type == DEVTYPE.AUDIO || type == DEVTYPE.ALL)
            {
                AudioCfg aCfg = JsonConvert.DeserializeObject<AudioCfg>(App.CRVideoCall.VideoSDK.getAudioCfg());
                List<AudioInfo> micDevs = JsonConvert.DeserializeObject<List<AudioInfo>>(App.CRVideoCall.VideoSDK.getAudioMics());
                List<AudioInfo> spkDevs = JsonConvert.DeserializeObject<List<AudioInfo>>(App.CRVideoCall.VideoSDK.getAudioSpks());

                cmbMics.Items.Clear();
                CAudioInfo aDevInfo = new CAudioInfo("", "默认设备");
                cmbMics.Items.Add(aDevInfo);
                cmbMics.SelectedIndex = 0;
                //下拉列表加载设备
                for (int i = 0; i < micDevs.Count; i++)
                {
                    AudioInfo dev = micDevs[i];
                    aDevInfo = new CAudioInfo(dev.id, dev.name);
                    cmbMics.Items.Add(aDevInfo);
                    if (aCfg.micID == aDevInfo.ID)
                    {
                        cmbMics.Text = aDevInfo.NAME;
                    }
                }

                cmbSpeakers.Items.Clear();
                aDevInfo = new CAudioInfo("", "默认设备");
                cmbSpeakers.Items.Add(aDevInfo);
                cmbSpeakers.SelectedIndex = 0;
                for (int i = 0; i < spkDevs.Count; i++)
                {
                    AudioInfo dev = spkDevs[i];
                    aDevInfo = new CAudioInfo(dev.id, dev.name);
                    cmbSpeakers.Items.Add(aDevInfo);
                    if (aCfg.spkID == aDevInfo.ID)
                    {
                        cmbSpeakers.Text = aDevInfo.NAME;
                    }
                }
            }


            if (type == DEVTYPE.VIDEO || type == DEVTYPE.ALL)
            {
                //获取视频设备
                cmbCameras.Items.Clear();
                int cameraId = App.CRVideoCall.VideoSDK.getDefaultVideo(Login.Instance.SelfUserId);
                List<VideoInfo> devs = JsonConvert.DeserializeObject<List<VideoInfo>>(App.CRVideoCall.VideoSDK.getAllVideoInfo(Login.Instance.SelfUserId));
                for (int i = 0; i < devs.Count; i++)
                {
                    VideoInfo dev = devs[i];
                    CCamInfo camInfo = new CCamInfo(dev.videoID, dev.videoName);
                    cmbCameras.Items.Add(camInfo);
                    if (cameraId == dev.videoID)
                    {
                        cmbCameras.Text = dev.videoName;
                    }
                }

                if (cameraId == 0 && devs.Count > 0) //如果还没选择设备，则选择一个
                {
                    cmbCameras.SelectedIndex = 0;
                    cameraId = devs[0].videoID;
                    App.CRVideoCall.VideoSDK.setDefaultVideo(Login.Instance.SelfUserId, cameraId);
                }
            }

            cmbMics.IsEnabled = true;
            cmbSpeakers.IsEnabled = true;
            cmbCameras.IsEnabled = true;
        }

        private void cmbCameras_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (cmbCameras.IsEnabled == false)
                return;

            CCamInfo camInfo = (CCamInfo)cmbCameras.SelectedItem;
            App.CRVideoCall.VideoSDK.setDefaultVideo(Login.Instance.SelfUserId, camInfo.ID);
            Console.WriteLine("cmbCameras_SelectedIndexChanged, set camera:" + App.CRVideoCall.VideoSDK.getDefaultVideo(Login.Instance.SelfUserId));
        }

        private void cmbSpeakers_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (cmbSpeakers.SelectedIndex < 0)
                return;

            AudioCfg cfg = new AudioCfg();
            if (cmbMics.SelectedIndex > 0)
            {
                CAudioInfo v = (CAudioInfo)cmbMics.SelectedItem;
                cfg.micID = v.ID;
            }
            if (cmbSpeakers.SelectedIndex > 0)
            {
                CAudioInfo v = (CAudioInfo)cmbSpeakers.SelectedItem;
                cfg.spkID = v.ID;
            }
            App.CRVideoCall.VideoSDK.setAudioCfg(JsonConvert.SerializeObject(cfg));

            Console.WriteLine("cmbSpeakers_SelectionChanged, set mic:" + cfg.micID + ", set speaker:" + cfg.spkID);
        }

        private void cmbMics_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (cmbMics.SelectedIndex < 0)
                return;

            AudioCfg cfg = new AudioCfg();
            if (cmbMics.SelectedIndex > 0)
            {
                CAudioInfo v = (CAudioInfo)cmbMics.SelectedItem;
                cfg.micID = v.ID;
            }
            if (cmbSpeakers.SelectedIndex > 0)
            {
                CAudioInfo v = (CAudioInfo)cmbSpeakers.SelectedItem;
                cfg.spkID = v.ID;
            }
            App.CRVideoCall.VideoSDK.setAudioCfg(JsonConvert.SerializeObject(cfg));

            Console.WriteLine("cmbMics_SelectionChanged, set mic:" + cfg.micID + ", set speaker:" + cfg.spkID);
        }

        public void endVideoSession(string sessionID)
        {
            mSessionID = sessionID;
            Close();
        }

        private void btnHungup_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            Console.WriteLine("FormClosed :" + mSessionID);

            //停止屏幕共享，初始化共享信息
            
            try
            {
                if (App.CRVideoCall.VideoSDK.isScreenShareStarted == 1)
                {
                    App.CRVideoCall.VideoSDK.stopScreenShare();
                }

                if (mSessionID != "")
                {
                    App.CRVideoCall.VideoSDK.hangupCall(mSessionID, "", "");
                }  
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
            App.CRVideoCall.VideoSDK.exitMeeting();         

            //关闭窗口时清理缓存数据            
            mSessionID = null;
            mPeerUserId = null;
            mSessionTick = 0;

            mTickTimer.Stop();
               
            videoUI_self.UI.clear();
            videoUI_peer.UI.clear();

            initDelegate(false);
        }

        private void btnCameraOpr_Click(object sender, RoutedEventArgs e)
        {
            int status = App.CRVideoCall.VideoSDK.getVideoStatus(Login.Instance.SelfUserId);
            if (status <= 2)
            {
                App.CRVideoCall.VideoSDK.openVideo(Login.Instance.SelfUserId);
                btnCameraOpr.Content = "关闭";
            }
            else
            {
                App.CRVideoCall.VideoSDK.closeVideo(Login.Instance.SelfUserId);
                btnCameraOpr.Content = "打开";
            }
        }

        private void btnMicOpr_Click(object sender, RoutedEventArgs e)
        {
            int micStatus = App.CRVideoCall.VideoSDK.getAudioStatus(Login.Instance.SelfUserId);
            if (micStatus <= 2)
            {
                App.CRVideoCall.VideoSDK.openMic(Login.Instance.SelfUserId);
                btnMicOpr.Content = "关闭";

            }
            else
            {
                App.CRVideoCall.VideoSDK.closeMic(Login.Instance.SelfUserId);
                btnMicOpr.Content = "打开";
            }
        }

        private void Tick(object sender, EventArgs e)
        {
            mSessionTick++;
            this.Title = String.Format("您正在和【{0}】视频会话中，通话时长：{1}", mPeerUserId, timeNumber2String(mSessionTick));
        }

        public string timeNumber2String(int number)
        {
            int h, m, s;
            h = m = s = 0;

            h = number / 3600;
            m = (number - h * 3600) / 60;
            s = number - h * 3600 - m * 60;

            String tickStr = "";
            if (h > 0) { tickStr += h + "时"; }
            if (m > 0) { tickStr += m + "分"; }
            if (s > 0) { tickStr += s + "秒"; }
            return tickStr;
        }

        public void startScreenShareRslt(object sender, ICloudroomVideoSDKEvents_startScreenShareRsltEvent e)
        {
            if (e.p_sdkErr != (int)VCALLSDK_ERR_DEF.VCALLSDK_NOERR)
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "开启屏幕共享失败：" + e.p_sdkErr });
            }
        }

        public void stopScreenShareRslt(object sender, ICloudroomVideoSDKEvents_stopScreenShareRsltEvent e)
        {
            if (e.p_sdkErr != (int)VCALLSDK_ERR_DEF.VCALLSDK_NOERR)
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "停止屏幕共享失败：" + CRError.Instance.getError(e.p_sdkErr) });
            }
        }

        private void btnScreenShot_Click(object sender, RoutedEventArgs e)
        {
            string picDir = Environment.CurrentDirectory + "\\Pictures\\";

            if (Directory.Exists(picDir) == false)
            {
                Directory.CreateDirectory(picDir);
            }

            string picName = picDir + DateTime.Now.ToString("yyyyMMddHHmmss") + "_" + mPeerUserId + ".bmp";
            int errCode = videoUI_peer.UI.savePic(picName);
            if (errCode == 0)
            {
                System.Windows.MessageBox.Show(this, "截图成功，保存至：\n" + picName);
            }
            else
            {
                System.Windows.MessageBox.Show(this, "截图失败，" + CRError.Instance.getError(errCode));
            }
        }

        private void btnSend_Click(object sender, RoutedEventArgs e)
        {
            if (mSendCmdWin == null)
            {
                mSendCmdWin = new SendCmdWin(mPeerUserId);
                mSendCmdWin.Owner = this;
                mSendCmdWin.Show();
                return;
            }

            if (mSendCmdWin.IsVisible == true)
            {
                mSendCmdWin.Visibility = Visibility.Hidden;
            }
            else
            {
                mSendCmdWin.Visibility = Visibility.Visible;
            }
        }

        public void sendFileRlst(object sender, ICloudroomVideoSDKEvents_sendFileRlstEvent e)
        {
            if (e.p_sdkErr != 0)
            {
                mSendCmdWin.sendFileRlst(e.p_sdkErr);
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "发送失败，代码：" + CRError.Instance.getError(e.p_sdkErr)});
            }
        }

        public void notifyFileData(object sender, ICloudroomVideoSDKEvents_notifyFileDataEvent e)
        {
            Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "收到" + e.p_sourceUserId + "发来的文件：\n" + e.p_orgFileName + "\n临时存放位置：" + e.p_tmpFile });
        }

        public void cancelSendRlst(object sender, ICloudroomVideoSDKEvents_cancelSendRlstEvent e)
        {
            if (e.p_sdkErr > 0)
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "取消发送失败！" + CRError.Instance.getError(e.p_sdkErr) });
            }
            else
            {
                mSendCmdWin.cancelSendRlst(0);
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "取消发送成功！" });
            }
        }

        public void sendProgress(object sender, ICloudroomVideoSDKEvents_sendProgressEvent e)
        {
            Console.WriteLine("sendBufferProgress:" + e.p_totalLen + "->" + e.p_sendedLen);

            mSendCmdWin.sendProgress(e.p_totalLen, e.p_sendedLen);
            //发完了，清空本次发送信息
            if (e.p_sendedLen == e.p_totalLen)
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "发送成功" });
            }
        }

        public void sendCmdRlst(object sender, ICloudroomVideoSDKEvents_sendCmdRlstEvent e)
        {
            if (e.p_sdkErr > 0)
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "发送命令数据失败，代码：" + CRError.Instance.getError(e.p_sdkErr) });
            }
            else
            {
                mSendCmdWin.sendCmdRlst(0);
            }
        }

        public void notifyCmdData(object sender, ICloudroomVideoSDKEvents_notifyCmdDataEvent e)
        {
            Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "来自[" + e.p_sourceUserId + "]的命令数据:\n\n" + e.p_data });
        }

        private void cmbVideoSize_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            updateVideoCfg();
        }

        private void updateVideoCfg()
        {
            VideoCfg cfg = new VideoCfg();
            cfg.size = cmbVideoSize.Text;
            if (cfg.size.Length <= 0)
                return;

            cfg.fps = (int)FPSBar.Value;
            if (rbVideoQuality.IsChecked == true)
            {
                cfg.qp_min = 22;
                cfg.qp_max = 25;
            }
            else
            {
                cfg.qp_min = 22;
                cfg.qp_max = 36;
            }

            if(App.CRVideoCall.VideoSDK.setVideoCfg(JsonConvert.SerializeObject(cfg)) == false)
            {
                MessageBox.Show(this, "视频配置失败，请检查配置");
            }
        }

        private void chkMute_Click(object sender, RoutedEventArgs e)
        {
            App.CRVideoCall.VideoSDK.speakerMute = chkMute.IsChecked==true ? 1 : 0;     
        }
        
        //shown
        private void Window_ContentRendered(object sender, EventArgs e)
        {
            double pw = this.ActualWidth;
            double ph = this.ActualHeight;

            double peer_w = pw * 2F / 3F; //对方视频窗口占整个窗体的2/3
            double peer_h = peer_w * 9F / 16F;

            panel_left.Width = peer_w - 2.0; //留点缝隙
            panel_left.Height = peer_h - 2.0;

            double self_w = pw / 3F; //自己视频窗口占整个窗体的2/3
            double self_h = self_w * 9F / 16F;

            panel_right.Width = self_w - 2.0;
            panel_right.Height = self_h - 2.0;
            row2.MinHeight = self_h;
            row2.MaxHeight = self_h;            
        }

        private void btnRecordStatus_Click(object sender, RoutedEventArgs e)
        {
            if(mRecordWin == null)
            {
                mRecordWin = new RecordWin(mPeerUserId, this);
                mRecordWin.Owner = this;
                mRecordWin.Show();
                return;
            }

            if (mRecordWin.IsVisible == true)
            {
                mRecordWin.Hide();
            }
            else
            {
                mRecordWin.Show();
            }
        }

        private void btnShotDir_Click(object sender, RoutedEventArgs e)
        {
            string fileDir = Environment.CurrentDirectory + "\\Pictures\\";
            if (Directory.Exists(fileDir) == false)
            {
                Directory.CreateDirectory(fileDir);
            }
            System.Diagnostics.Process.Start("explorer.exe", fileDir); 
        }

        private void rbVideoQuality_Checked(object sender, RoutedEventArgs e)
        {
            if (rbVideoSpeed != null)
            {    
                updateVideoCfg();
            }
        }

        private void rbVideoSpeed_Checked(object sender, RoutedEventArgs e)
        {
            if (rbVideoQuality != null)
            {
                updateVideoCfg();
            }
        }

        private void FPSBar_DragCompleted(object sender, System.Windows.Controls.Primitives.DragCompletedEventArgs e)
        {
            updateVideoCfg();
        }
    }

    //进度条转换器
    public class ProgressBarValueConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            double v = (double)value;

            string imageUri = "/Res/net_0.png";

            if (v > 7)
            {
                imageUri = "/Res/net_5.png";
            }
            else if (v > 4)
            {
                imageUri = "/Res/net_3.png";
            }
            else 
            {
                imageUri = "/Res/net_1.png";
            }

            BitmapImage img = new BitmapImage(new Uri(imageUri, UriKind.Relative));

            return img;
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}
