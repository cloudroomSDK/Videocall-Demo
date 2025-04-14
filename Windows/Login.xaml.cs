using System;
using System.Windows;
using System.Text;
using System.Security.Cryptography;
using System.Collections.Generic;
using AxnpcloudroomvideosdkLib;
using System.IO;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace SDKDemo
{
    /// <summary>
    /// Login.xaml 的交互逻辑
    /// </summary>
    public partial class Login : Window
    {
        private CallDirect mCallDirect;
        private static Login instance;
        private ServiceWin mService;                      //专家坐席服务界面
        private ClientWin mClient;                         //客户选择业务界面
        private VideoSessionWin mVideoSession;             //视频会话界面
        private string mActiveXVersion = "1.4";             //程序使用的ocx组件版本
        private string mUserID = "";

        public Login()
        {
            instance = this;
            InitializeComponent();
            initVideoCallDelegate();

            IniFile iniFile = new IniFile(Directory.GetCurrentDirectory() + "/VideoCall.ini");  //获取当前根目录
            edtNickname.Text = iniFile.ReadValue("Cfg", "LastUser", "");
            string role = iniFile.ReadValue("Cfg", "lastRole", "0");
            cmbRole.SelectedIndex = Convert.ToInt32(role);

        }

        public static Login Instance
        {
            get 
            {
                return instance; 
            }
        }

        //委托方法关联
        private void initVideoCallDelegate()
        {
            App.CRVideoCall.VideoSDK.loginSuccess += loginSuccess;
            App.CRVideoCall.VideoSDK.loginFail += loginFailed;
            App.CRVideoCall.VideoSDK.lineOff += lineOff;
            App.CRVideoCall.VideoSDK.initQueueDatRslt += initQueueDatRslt;
            App.CRVideoCall.VideoSDK.notifyCallHungup += notifyHungupCall;
            App.CRVideoCall.VideoSDK.hangupCallSuccess += hungupCallSuccess;
            App.CRVideoCall.VideoSDK.hangupCallFail += hungupCallFail;
            App.CRVideoCall.VideoSDK.enterMeetingRslt += enterMeetingRslt;
            App.CRVideoCall.VideoSDK.userEnterMeeting += userEnterMeeting;
            App.CRVideoCall.VideoSDK.meetingDropped += meetingDropped;
        }

        //服务端消息处理使用异步消息弹框，防止阻塞对服务器的响应
        private delegate void messageBoxDelegate(string desc);
        private void BeginInvokeMessageBox(string desc) { MessageBox.Show(this, desc); }

        public string SelfUserId
        {
            get { return edtNickname.Text; }
        }

        public bool IsServiceRole()
        {
            return cmbRole.SelectedIndex == 0;  //坐席
        }
        
        //开始会话
        public void startVideoSession(string sessionCallID, string peerUserID)
        {
            if (mVideoSession!=null)
            {
                mVideoSession = null;
                GC.Collect();
            }
            mVideoSession = new VideoSessionWin();
            mVideoSession.initSessionInfo(peerUserID, sessionCallID);

            if (cmbRole.SelectedIndex == 0)  //加载专家坐席数据
            {
                mVideoSession.Owner = mService;
                mService.Hide();
            }
            else  //加载用户数据
            {
                mVideoSession.Owner = mClient;
                mClient.Hide();
            }
                        
            mVideoSession.ShowDialog();

            if (cmbRole.SelectedIndex == 0)
            {
                mService.Show();
            }
            else
            {
                mClient.Show();
            }
        }

        public void startVideoSession_callDirect(string sessionCallID, string peerUserID)
        {
            if (mVideoSession != null)
            {
                mVideoSession = null;
                GC.Collect();
            }
            mVideoSession = new VideoSessionWin();
            mVideoSession.initSessionInfo(peerUserID, sessionCallID);

            mCallDirect.Hide();

            mVideoSession.ShowDialog();

            mCallDirect.Show();
        }
        //结束会话
        private void endVideoSession(string sessionCallID)
        {
            if (sessionCallID != "")
            {
                App.CRVideoCall.VideoSDK.hangupCall(sessionCallID, "", "");
            }

            if (mVideoSession != null)
            {
                mVideoSession.endVideoSession(sessionCallID);  //关闭视频会话界面
                mVideoSession = null;
            }

            if (cmbRole.SelectedIndex == 0)
            {
                mService.Show();
            }
            else
            {
                mClient.Show();
            }
        }

        private void endVideoSession_callDirect(string sessionCallID)
        {
            if (sessionCallID != "")
            {
                App.CRVideoCall.VideoSDK.hangupCall(sessionCallID, "", "");
            }

            if (mVideoSession != null)
            {
                mVideoSession.endVideoSession(sessionCallID);  //关闭视频会话界面
                mVideoSession = null;
            }

            mCallDirect.Show();
        }

        public void Logout()
        {
            Console.WriteLine("Logout~~~");

            if (mClient != null)
            {
                mClient.lineOff();
                mClient = null;
            }
            if (mService != null)
            {
                mService.lineOff();
                mService = null;
            }
            if (mVideoSession != null)
            {
                mVideoSession.Close();
                mVideoSession = null;
            }

            if (mCallDirect != null)
            {
                mCallDirect.lineOff();
                mCallDirect = null;
            }

            App.CRVideoCall.VideoSDK.logout();
            App.CRVideoCall.VideoSDK.uninit();
            this.Show();
        }

        private void btnLogin_Click(object sender, RoutedEventArgs e)
        {
            Console.WriteLine(App.CRVideoCall.VideoSDK.Version);
            int versionInfo = String.Compare(App.CRVideoCall.VideoSDK.Version, mActiveXVersion);
            if (versionInfo < 0)
            {
                MessageBox.Show("ActiveX组件版本过低, 请重新安装新版本！");
                return;
            }

            if (edtNickname.Text.Trim().Length > 15)
            {
                MessageBox.Show("昵称长度不能超过15");
                return;
            }           

            startLogin();

            btnLogin.IsEnabled = false;
        }

        private void startLogin()
        {
            //初始化云屋sdk组件
            App.CRVideoCall.VideoSDK.setSDKParams("{\"DatEncType\":0}");
            App.CRVideoCall.VideoSDK.init_2(Environment.CurrentDirectory);


            //sdk参数
            JObject sdkParamJson = new JObject();
            IniFile iniFile = new IniFile(Directory.GetCurrentDirectory() + "/VideoCall.ini");  //获取当前根目录
            int httpType = Convert.ToInt32(iniFile.ReadValue("Cfg", "HttpType", "1"));
            if (httpType == 0)
            {
                sdkParamJson.Add("DatEncType", "0");
            }
            string sdkParamJsonStr = JsonConvert.SerializeObject(sdkParamJson);
            App.CRVideoCall.VideoSDK.setSDKParams(sdkParamJsonStr);


            App.CRVideoCall.VideoSDK.serverAddr = iniFile.ReadValue("Cfg", "LastServer", "sdk.cloudroom.com");
            string account = iniFile.ReadValue("Cfg", "LastAccount", AccountInfo.TEST_AppID);
            string password = iniFile.ReadValue("Cfg", "LastPwd", App.getMD5Value(AccountInfo.TEST_AppSecret));
            mUserID = edtNickname.Text.Trim();
            App.CRVideoCall.VideoSDK.login(account, password, mUserID, "", "");   //后两处参数按需传入

            iniFile.WriteValue("Cfg", "LastUser", mUserID);
        }

        private void Window_Closed(object sender, System.EventArgs e)
        {
            Console.WriteLine("-----uninit-------------------");
            GC.Collect();
        }

        private void loginSuccess(object sender, ICloudroomVideoSDKEvents_loginSuccessEvent e)
        {
            Console.WriteLine("loginSuccess:" + e.p_usrID);
            btnLogin.IsEnabled = true;
            this.Hide();

            SelectPage page = new SelectPage();
            page.ShowDialog();
            if(page.getRslt().HasValue == false)
            {
                App.CRVideoCall.VideoSDK.logout();
                this.Show();
                return;
            }

            if(page.getRslt() == 2)
            {
                App.CRVideoCall.VideoSDK.initQueueDat("");  //初始化专家坐席用户队列

                if (cmbRole.SelectedIndex == 0)  //坐席
                {
                    mService = new ServiceWin();
                    mService.Owner = this;
                    mService.ShowDialog();
                }
                else if (cmbRole.SelectedIndex == 1) //客户
                {
                    mClient = new ClientWin();
                    mClient.Owner = this;
                    mClient.ShowDialog();
                }
            }
            else
            {
                mCallDirect = new CallDirect();
                mCallDirect.Owner = this;
                mCallDirect.ShowDialog();
            }
            
            //this.Show();
        }

        //登陆失败
        private void loginFailed(object sender, ICloudroomVideoSDKEvents_loginFailEvent e)
        {
            Console.WriteLine("loginFailed:" + e.p_sdkErr);
            Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "登陆出错，请重试，代码：" + e.p_sdkErr });

            btnLogin.IsEnabled = true;
        }

        //队列初始化响应
        private void initQueueDatRslt(object sender, ICloudroomVideoSDKEvents_initQueueDatRsltEvent e)
        {
            Console.WriteLine("initQueueDatRslt:" + e.p_sdkErr);

            if (e.p_sdkErr != 0)
            {
                this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "队列初始化出错，请重新登陆" + CRError.Instance.getError(e.p_sdkErr) });
                return;
            }
            //队列初始化成功后获取上一次意外结束的视频会话信息，如果存在，则可以选择恢复会话
            VideoSessionInfo sessionInfo = JsonConvert.DeserializeObject<VideoSessionInfo>(App.CRVideoCall.VideoSDK.getSessionInfo());
            if (sessionInfo.callID != "" && sessionInfo.duration > 0)
            {
                if (MessageBox.Show("是否恢复意外关闭的视频会话？", "提示", MessageBoxButton.YesNo) == MessageBoxResult.Yes)
                {
                    App.CRVideoCall.VideoSDK.enterMeeting3(sessionInfo.meetingID);
                    startVideoSession(sessionInfo.callID, sessionInfo.peerID);
                }
                else //结束上次的会话，准备新的会话
                {
                    endVideoSession(sessionInfo.callID);
                }
            }

            List<QueueInfo> queues = JsonConvert.DeserializeObject<List<QueueInfo>>(App.CRVideoCall.VideoSDK.getAllQueueInfo());
            if (cmbRole.SelectedIndex == 0)  //加载专家坐席数据
            {
                mService.setNickName(edtNickname.Text.Trim());
                mService.setQueues(queues);
            }
            else if (cmbRole.SelectedIndex == 1) //加载用户数据
            {
                mClient.setNickName(edtNickname.Text.Trim());
                mClient.setQueues(queues);
            }
        }
        //掉线，关闭所有窗口，提示重新登陆
        private void lineOff(object sender, ICloudroomVideoSDKEvents_lineOffEvent e)
        {
            Console.WriteLine("lineOff:" + e.p_sdkErr);

            if (mVideoSession != null)
            {
                mVideoSession.Close();
                mVideoSession = null;
            }
            if (mClient != null)
            {
                mClient.lineOff();
                mClient = null;
            }
            if (mService != null)
            {
                mService.lineOff();
                mService = null;
            }

            if(mCallDirect != null)
            {
                mCallDirect.lineOff();
                mCallDirect = null;
            }

            if (e.p_sdkErr == (int)VCALLSDK_ERR_DEF.VCALLSDK_USER_BEEN_KICKOUT)
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "您被挤掉线，请检查昵称重新登陆" + CRError.Instance.getError(e.p_sdkErr) });
            }
            else
            {
                Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "您已掉线，请重新登陆" + CRError.Instance.getError(e.p_sdkErr) });
            }   

            Logout();
        }
        //对方挂断通知
        private void notifyHungupCall(object sender, ICloudroomVideoSDKEvents_notifyCallHungupEvent e)
        {
            Console.WriteLine("notifyHungupCall:" + e.p_callID);
            if(mCallDirect != null)
            {
                endVideoSession_callDirect(mCallDirect.getCallID());
                return;
            }
            //关闭视频会话窗口
            if (mVideoSession != null)
            {                
                endVideoSession("");    //关闭会话窗口，对方通知挂断，会话由其结束，自己只需要关闭会话窗口
                MessageBox.Show(mVideoSession, "对方已挂断会话");
            }
        }

        private void hungupCallSuccess(object sender, ICloudroomVideoSDKEvents_hangupCallSuccessEvent e)
        {
            Console.WriteLine("hungupCallSuccess:" + e.p_callID);
        }
        //
        private void hungupCallFail(object sender, ICloudroomVideoSDKEvents_hangupCallFailEvent e)
        {
            Console.WriteLine("hungupCallSuccess:" + e.p_callID + ",err:" + e.p_sdkErr);
        }
        //进入会话响应
        private void enterMeetingRslt(object sender, ICloudroomVideoSDKEvents_enterMeetingRsltEvent e)
        {
            Console.WriteLine("enterMeetingRslt:" + e.p_sdkErr);
            if (e.p_sdkErr == 0)
            {
                App.CRVideoCall.VideoSDK.setEnableMutiVideo(mUserID, 0);
                mVideoSession.initVideoSession();
            }
            else //如果入会失败，可以从sdk中获取缓存的会话信息，尝试重新进入
            {
                if(mCallDirect != null)
                {
                    endVideoSession_callDirect(mCallDirect.getCallID());
                    return;
                }
                VideoSessionInfo sessionInfo = JsonConvert.DeserializeObject<VideoSessionInfo>(App.CRVideoCall.VideoSDK.getSessionInfo());
                if (sessionInfo.callID != "" && sessionInfo.duration > 0)
                {
                    if (MessageBox.Show("启动视频会话失败，是否重试？", "警告", MessageBoxButton.YesNo) == MessageBoxResult.Yes)
                    {
                        App.CRVideoCall.VideoSDK.enterMeeting3(sessionInfo.meetingID);
                        startVideoSession(sessionInfo.callID, sessionInfo.peerID);
                    }
                    else
                    {
                        endVideoSession(sessionInfo.callID);
                    }
                }
                else//入会失败又没有缓存会议信息则直接关闭会话窗口
                {
                    endVideoSession("");
                }
            }
        }
        //对方进入会话
        private void userEnterMeeting(object sender, ICloudroomVideoSDKEvents_userEnterMeetingEvent e)
        {
            Console.WriteLine("userEnterMeeting:" + e.p_userID);
            mVideoSession.userEnterMeeting(e.p_userID);
        }
        //会话掉线
        private void meetingDropped(object sender, ICloudroomVideoSDKEvents_meetingDroppedEvent e)
        {
            Console.WriteLine("meetingDropped");
            if (mCallDirect != null)
            {
                endVideoSession_callDirect(mCallDirect.getCallID());
                return;
            }
            VideoSessionInfo sessionInfo = Newtonsoft.Json.JsonConvert.DeserializeObject<VideoSessionInfo>(App.CRVideoCall.VideoSDK.getSessionInfo());
            if (sessionInfo.callID != "")
            {
                //if (MessageBox.Show(mVideoSession, "视频会话掉线，是否重新连接？", "警告", MessageBoxButton.YesNo) == MessageBoxResult.Yes)
                //{
                //    App.CRVideoCall.Video.enterMeeting3(sessionInfo.meetingID);
                //}
                //else
                {
                    endVideoSession(sessionInfo.callID);
                }
            }
        }

        private void btnSet_Click(object sender, RoutedEventArgs e)
        {
            Set set = new Set(this);
            set.ShowDialog();
        }
    }

}
