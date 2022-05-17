using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Threading;
using System.IO;
using Newtonsoft.Json;
using AxnpcloudroomvideosdkLib;

namespace VideoCall
{
    /// <summary>
    /// Record.xaml 的交互逻辑
    /// </summary>
    public partial class RecordWin : Window
    {
        private string mLocMixId = "1";
        private int mRecordWidth = 1280;    //录制文件宽度
        private int mRecordHeight = 720;    //录制文件高度
        private int mFrameRate = 15;
        private int mBitRate = 1000000;
        private int mDefaultQP = 24;
        private int mGop { get { return mFrameRate * 15; } }

        private string mPeerUserID;
        private MIXER_STATE localRecordST = MIXER_STATE.MST_NULL;
        private MIXER_STATE cloudRecordST = MIXER_STATE.MST_NULL;

        private delegate void messageBoxDelegate(string desc);
        private void BeginInvokeMessageBox(string desc)
        {
            System.Windows.MessageBox.Show(this, desc);
        }

        public RecordWin(string peerUserID, VideoSessionWin videoSession)
        {
            InitializeComponent();
            initDelegate(true);
            rbnLocal.IsChecked = true;

            mPeerUserID = peerUserID;
            //本地录制状态
            localRecordST = (MIXER_STATE)(App.CRVideoCall.Video.getLocMixerState(mLocMixId));

            //云端录制状态(座席才可以控制）
            cloudRecordST = MIXER_STATE.MST_NULL;
            if ( Login.Instance.IsServiceRole() )
            {
                string cloudMixerInfoListStr = App.CRVideoCall.Video.getAllCloudMixerInfo();
                List<CloudMixerInfo> cloudMixerInfoList = JsonConvert.DeserializeObject<List<CloudMixerInfo>>(cloudMixerInfoListStr);
                if (cloudMixerInfoList.Count > 0)
                {
                    cloudRecordST = (MIXER_STATE)(cloudMixerInfoList[0].state);
                }
            }
            else
            {
                rbnCloud.Visibility = Visibility.Hidden;
            }
            updateRecordStateUI();

            videoSession.devChangeEvent += new devChangeHandler(RecordWin_devChange);
        }

        public void initDelegate(bool isInit)
        {
            if (isInit)
            {
                App.CRVideoCall.Video.locMixerStateChanged += Meeting_locMixerStateChanged;
                App.CRVideoCall.Video.locMixerOutputInfo += Meeting_locMixerOutputInfo;
                App.CRVideoCall.Video.createCloudMixerFailed += Meeting_createCloudMixerFailed;
                App.CRVideoCall.Video.cloudMixerStateChanged += Meeting_cloudMixerStateChanged;
                App.CRVideoCall.Video.cloudMixerOutputInfoChanged += Meeting_cloudMixerOutputInfoChanged;
            }
            else
            {
                App.CRVideoCall.Video.locMixerStateChanged -= Meeting_locMixerStateChanged;
                App.CRVideoCall.Video.locMixerOutputInfo -= Meeting_locMixerOutputInfo;
                App.CRVideoCall.Video.createCloudMixerFailed -= Meeting_createCloudMixerFailed;
                App.CRVideoCall.Video.cloudMixerStateChanged -= Meeting_cloudMixerStateChanged;
                App.CRVideoCall.Video.cloudMixerOutputInfoChanged -= Meeting_cloudMixerOutputInfoChanged;
            }
        }

        public void RecordWin_devChange()
        {
        }

        void updateRecordStateUI()
        {
            if (localRecordST != MIXER_STATE.MST_NULL || cloudRecordST != MIXER_STATE.MST_NULL)
            {
                if (cloudRecordST != MIXER_STATE.MST_NULL)
                {
                    rbnCloud.IsChecked = true;
                }
                else
                {
                    rbnLocal.IsChecked = true;
                }

                rbnLocal.IsEnabled = false;
                rbnCloud.IsEnabled = false;
                btnRecordOpr.Content = "停止录制";
            }
            else
            {
                rbnLocal.IsEnabled = true;
                rbnCloud.IsEnabled = true;
                btnRecordOpr.Content = "开始录制";
            }
        }

        void Meeting_locMixerStateChanged(object sender, ICloudroomVideoSDKEvents_locMixerStateChangedEvent e)
        {
            Console.WriteLine("loc record state changed, state:{0}", e.p_state);
            localRecordST = (MIXER_STATE)e.p_state;
            updateRecordStateUI();
        }

        void Meeting_locMixerOutputInfo(object sender, ICloudroomVideoSDKEvents_locMixerOutputInfoEvent e)
        {
            LocMixerOutputInfoObj obj = JsonConvert.DeserializeObject<LocMixerOutputInfoObj>(e.p_outputInfo);
            if (obj.state == Convert.ToInt32(LOCMIXER_OUTPUT_STATE.LOCMOST_INFOUPDATE)
                || obj.state == Convert.ToInt32(LOCMIXER_OUTPUT_STATE.LOCMOST_CLOSE) )
            {
                label_record_desc.Text = String.Format("录制时长:{0}s, 文件大小:{1}kb", obj.duration / 1000, obj.filesize / 1024);
            }

            if (obj.state == Convert.ToInt32(LOCMIXER_OUTPUT_STATE.LOCMOST_ERR))
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "录制发生异常:" + CRError.Instance.getError(obj.errCode) });
                
                //结束本地录制
                App.CRVideoCall.Video.destroyLocMixer(mLocMixId);
            }
        }

        void Meeting_createCloudMixerFailed(object sender, ICloudroomVideoSDKEvents_createCloudMixerFailedEvent e)
        {
            Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "开启云端录制失败:" + CRError.Instance.getError(e.p_err) });
        }

        void Meeting_cloudMixerStateChanged(object sender, ICloudroomVideoSDKEvents_cloudMixerStateChangedEvent e)
        {
            if (!Login.Instance.IsServiceRole())
            {
                return;
            }

            Console.WriteLine("cloud record state changed, state:{0}", e.p_state);
            cloudRecordST = (MIXER_STATE)e.p_state;
            updateRecordStateUI();

            if ( cloudRecordST == MIXER_STATE.MST_NULL )
            {
                CloudMixerErrInfo errInfo = JsonConvert.DeserializeObject<CloudMixerErrInfo>(e.p_exParam);
                if ( errInfo.err!=0 )
                {
                    Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "录制异常结束:" + CRError.Instance.getError(errInfo.err) });
                }
            }
        }

        void Meeting_cloudMixerOutputInfoChanged(object sender, ICloudroomVideoSDKEvents_cloudMixerOutputInfoChangedEvent e)
        {
            if ( !Login.Instance.IsServiceRole() )
            {
                return;
            }

            CloudMixerOutputInfo obj = JsonConvert.DeserializeObject<CloudMixerOutputInfo>(e.p_jsonStr);
            if (obj.state == Convert.ToInt32(CLOUDMIXER_OUTPUT_STATE.CLOUDMOST_RUNNING)
                || obj.state == Convert.ToInt32(CLOUDMIXER_OUTPUT_STATE.CLOUDMOST_STOPPED))
            {
                label_record_desc.Text = String.Format("录制时长:{0}s, 文件大小:{1}kb", obj.duration / 1000, obj.fileSize / 1024);
            }

            if (obj.state == Convert.ToInt32(CLOUDMIXER_OUTPUT_STATE.CLOUDMOST_FAIL))
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "录制发生异常:" + CRError.Instance.getError(obj.errCode) });
                //结束云端录制
                App.CRVideoCall.Video.destroyCloudMixer(obj.id);
            }
        }

        private void btnRecordOpr_Click(object sender, RoutedEventArgs e)
        {
            if ( (rbnLocal.IsChecked == true) )
            {
                localRecord();
            }
            else
            {
                cloudRecord();
            }
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

        private void btnOpenDir_Click(object sender, RoutedEventArgs e)
        {
            if (rbnLocal.IsChecked == true)
            {
                string fileDir = Environment.CurrentDirectory + "\\Record\\";
                if (Directory.Exists(fileDir) == false)
                {
                    Directory.CreateDirectory(fileDir);
                }
                System.Diagnostics.Process.Start("explorer.exe", fileDir);
            }
            else
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "云端录制，文件保存在服务器上" });
            }
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            this.Hide();
            e.Cancel = true;
        }

        private new void Closed()
        {
            initDelegate(false);
        }

        private void localRecord()
        {
            if (localRecordST != MIXER_STATE.MST_NULL)
            {
                //停止录像
                App.CRVideoCall.Video.destroyLocMixer(mLocMixId);
            }
            else
            {
                //开启本地混图器
                int nRet = App.CRVideoCall.Video.createLocMixer(mLocMixId, locMixerCfg(), mixerContentsString());
                if (nRet != 0)
                {
                    Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "录制发生错误，代码：" + CRError.Instance.getError(nRet) });
                    return;
                }

                //添加输出
                nRet = App.CRVideoCall.Video.addLocMixerOutput(mLocMixId, locOutput());
                if (nRet != 0)
                {
                    App.CRVideoCall.Video.destroyLocMixer(mLocMixId);
                    Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "录制发生错误，代码：" + CRError.Instance.getError(nRet) });
                    return;
                }
            }
        }

        private void cloudRecord()
        {
            if (cloudRecordST != MIXER_STATE.MST_NULL)
            {
                string cloudMixerInfoListStr = App.CRVideoCall.Video.getAllCloudMixerInfo();
                List<CloudMixerInfo> cloudMixerInfoList = JsonConvert.DeserializeObject<List<CloudMixerInfo>>(cloudMixerInfoListStr);
                if (cloudMixerInfoList.Count > 0)
                {
                    App.CRVideoCall.Video.destroyCloudMixer(cloudMixerInfoList[0].ID);
                }
            }
            else
            {
                string cloudMixID = App.CRVideoCall.Video.createCloudMixer(cloudMixerCfg());
            }
        }

        private string locMixerCfg()
        {
            LocMixerCfgObj _cfg = new LocMixerCfgObj();
            _cfg.width = mRecordWidth;
            _cfg.height = mRecordHeight;
            _cfg.frameRate = mFrameRate;
            _cfg.bitRate = mBitRate;
            _cfg.defaultQP = mDefaultQP;
            _cfg.gop = mGop; //15秒一个I帧

            string str = JsonConvert.SerializeObject(_cfg);
            return str;
        }

        private string locOutput()
        {
            LocMixeroutputObjFile obj = new LocMixeroutputObjFile();
            string recordFileName = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss_Win32_") + ".mp4";
            string recordDir = Environment.CurrentDirectory + "\\Record\\";
            if (Directory.Exists(recordDir) == false)
            {
                Directory.CreateDirectory(recordDir);
            }
            obj.filename = recordDir + recordFileName;
            obj.isUploadOnRecording = 0;
            obj.type = Convert.ToInt32(MIXER_OUTPUT_TYPE.MIXOT_FILE);

            List<LocMixeroutputObjFile> objlist = new List<LocMixeroutputObjFile>();
            objlist.Add(obj);
            string str = JsonConvert.SerializeObject(objlist);
            return str;
        }

        private List<MixerContentObj> mixerContentList()
        {
            List<MixerContentObj> contentList = new List<MixerContentObj>();

            //添加摄像头
            MixerContentObj mixcam = new MixerContentObj();
            mixcam.type = Convert.ToInt32(MIXER_VCONTENT_TYPE.MIXVTP_VIDEO);
            mixcam.keepAspectRatio = 1;
            mixcam.left = 0;      //定义位置
            mixcam.top = 0;
            mixcam.width = mRecordWidth;
            mixcam.height = mRecordHeight;
            paramCam paCam = new paramCam();
            paCam.camid = String.Format("{0}.{1}", mPeerUserID, -1);
            mixcam.param = paCam;


            int w = mRecordWidth / 3;
            int h = mRecordHeight / 3;

            MixerContentObj mixsmallcam = new MixerContentObj();
            mixsmallcam.type = Convert.ToInt32(MIXER_VCONTENT_TYPE.MIXVTP_VIDEO);
            mixsmallcam.keepAspectRatio = 1;
            mixsmallcam.left = mRecordWidth - w;     //定义位置
            mixsmallcam.top = mRecordHeight - h; ;
            mixsmallcam.width = w;
            mixsmallcam.height = h;
            paramCam paCam2 = new paramCam();
            paCam2.camid = String.Format("{0}.{1}", Login.Instance.SelfUserId, -1);
            mixsmallcam.param = paCam2;

            contentList.Add(mixcam);
            contentList.Add(mixsmallcam);

            return contentList;
        }

        private string mixerContentsString()
        {
            List<MixerContentObj> contentList = mixerContentList();
            string str = JsonConvert.SerializeObject(contentList);
            return str;
        }

        private string cloudMixerCfg()
        {
            string recordFileName = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss") + "_Win32.mp4";
            string recordDir = "/" + recordFileName.Substring(0, 10) + "/";

            CloudMixerCfgObj cloudCfg = new CloudMixerCfgObj();
            cloudCfg.videoFileCfg = new CloudMixerVideoFileCfg();
            cloudCfg.videoFileCfg.svrPathName = recordDir + recordFileName;
            cloudCfg.videoFileCfg.vWidth = mRecordWidth;
            cloudCfg.videoFileCfg.vHeight = mRecordHeight;
            cloudCfg.videoFileCfg.vFps = mFrameRate;
            cloudCfg.videoFileCfg.vBps = mBitRate;
            cloudCfg.videoFileCfg.vQP = mDefaultQP;
            cloudCfg.videoFileCfg.layoutConfig = mixerContentList();

            string str = JsonConvert.SerializeObject(cloudCfg);
            return str;
        }

    }
}
