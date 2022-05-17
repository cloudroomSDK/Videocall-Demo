using AxnpcloudroomvideosdkLib;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace VideoCall
{
    /// <summary>
    /// CallDirect.xaml 的交互逻辑
    /// </summary>
    public partial class CallDirect : Window
    {
        private string mOtherUsrID = "";
        private string mCallID = "";
        private ConnectWin mConnectWin = null;
        public CallDirect()
        {
            InitializeComponent();
            this.Title = string.Format("直呼(我的ID:{0})", Login.Instance.SelfUserId);
            initServiceDelegate(true);
        }

        public void lineOff()
        {
            initServiceDelegate(false);
        }
        public string getCallID()
        {
            return mCallID;
        }
        private void initServiceDelegate(bool isInit)
        {
            if (isInit)
            {
                App.CRVideoCall.Video.acceptCallSuccess += acceptCallSuccess;
                App.CRVideoCall.Video.acceptCallFail += acceptCallFail;
                App.CRVideoCall.Video.notifyCallIn += notifyCallIn;
                App.CRVideoCall.Video.createMeetingSuccess += createMeetingSuccess;
                App.CRVideoCall.Video.createMeetingFail += createMeetingFail;
              //  App.CRVideoCall.Video.callSuccess += callSuccess;
                App.CRVideoCall.Video.callFail += callFail;
                App.CRVideoCall.Video.notifyCallAccepted += notifyCallAccepted;
                App.CRVideoCall.Video.notifyCallRejected += notifyCallRejected;
                App.CRVideoCall.Video.notifyCallHungup += notifyCallHungup;

            }
            else
            {
                App.CRVideoCall.Video.acceptCallSuccess -= acceptCallSuccess;
                App.CRVideoCall.Video.acceptCallFail -= acceptCallFail;
                App.CRVideoCall.Video.notifyCallIn -= notifyCallIn;
                App.CRVideoCall.Video.createMeetingSuccess -= createMeetingSuccess;
                App.CRVideoCall.Video.createMeetingFail -= createMeetingFail;
               // App.CRVideoCall.Video.callSuccess -= callSuccess;
                App.CRVideoCall.Video.callFail -= callFail;
                App.CRVideoCall.Video.notifyCallAccepted -= notifyCallAccepted;
                App.CRVideoCall.Video.notifyCallRejected -= notifyCallRejected;
            }
        }

        private void btn_call_click(object sender, RoutedEventArgs e)
        {
            if(string.IsNullOrEmpty(textUsrID.Text))
            {
                MessageBox.Show("呼叫ID不能为空");
                return;
            }
            btnCall.IsEnabled = false;
            App.CRVideoCall.Video.createMeeting2("", ""); //是否使用会议密码：0，不适用
        }

        public void createMeetingSuccess(object sender, ICloudroomVideoSDKEvents_createMeetingSuccessEvent e)
        {
            if(e.p_cookie == "")
            {
                mOtherUsrID = textUsrID.Text.Trim();
                App.CRVideoCall.Video.call(textUsrID.Text.Trim(), e.p_meetObj, "", "");

            }
        }

        public void createMeetingFail(object sender, ICloudroomVideoSDKEvents_createMeetingFailEvent e)
        { 
            MessageBox.Show("呼叫失败,会议未创建成功,错误码:" + e.p_sdkErr);
            btnCall.IsEnabled = true;
        }
        public void callFail(object sender, ICloudroomVideoSDKEvents_callFailEvent e)
        {
            MessageBox.Show("呼叫失败,错误码:" + e.p_sdkErr);
            btnCall.IsEnabled = true;
        }

        public void notifyCallAccepted(object sender, ICloudroomVideoSDKEvents_notifyCallAcceptedEvent e)
        {
            Console.WriteLine("notifyCallAccepted");
            mCallID = e.p_callID;
            MeetObj meet = JsonConvert.DeserializeObject<MeetObj>(e.p_meetObj);
            App.CRVideoCall.Video.enterMeeting3(meet.ID);
            Login.Instance.startVideoSession_callDirect(e.p_callID, mOtherUsrID);
            btnCall.IsEnabled = true;

        }
        public void notifyCallRejected(object sender, ICloudroomVideoSDKEvents_notifyCallRejectedEvent e)
        {
            Tip tip = new VideoCall.Tip();
            tip.setText("呼叫已被对方拒绝");
            tip.Show();
            btnCall.IsEnabled = true;
        }

        public void notifyCallIn(object sender, ICloudroomVideoSDKEvents_notifyCallInEvent e)
        {
            mConnectWin = new ConnectWin();
            mConnectWin.Owner = this;
            mConnectWin.setTitle("用户呼叫");
            mConnectWin.setUser(e.p_callerID);
            btnCall.IsEnabled = false;
            mConnectWin.ShowDialog();
            btnCall.IsEnabled = true;
            ConnectWin.CLOSE_REASON reason = mConnectWin.getCloseReason();
            mConnectWin = null;
            if (reason == ConnectWin.CLOSE_REASON.CLOSE_BY_REJECT)
            {
                App.CRVideoCall.Video.rejectCall(e.p_callID, "", "");
                return;
            }
            else if (reason == ConnectWin.CLOSE_REASON.CLOSE_BY_CANCEL)
            {
                return;
            }
            mOtherUsrID = e.p_callerID;
            App.CRVideoCall.Video.acceptCall(e.p_callID, e.p_meetObj, "", e.p_meetObj);
        }

        public void acceptCallSuccess(object sender, ICloudroomVideoSDKEvents_acceptCallSuccessEvent e)
        {
            Console.WriteLine("acceptCallSucceed");
            MeetObj meet = JsonConvert.DeserializeObject<MeetObj>(e.p_cookie);
            mCallID = e.p_callID;
            App.CRVideoCall.Video.enterMeeting3(meet.ID);

            this.Dispatcher.BeginInvoke((Action)delegate()
            {
                Login.Instance.startVideoSession_callDirect(e.p_callID, mOtherUsrID);
            });
            //打开会话界面
        }

        public void acceptCallFail(object sender, ICloudroomVideoSDKEvents_acceptCallFailEvent e)
        {
            Tip tip = new VideoCall.Tip();
            tip.setText("接收呼叫失败");
            tip.Show();

        }

        private void Window_Closed(object sender, EventArgs e)
        {
            Login.Instance.Logout();
            initServiceDelegate(false);
        }

        private void notifyCallHungup(object sender, ICloudroomVideoSDKEvents_notifyCallHungupEvent e)
        {
            if (mConnectWin != null)
            {
                this.Dispatcher.BeginInvoke(new Action(delegate(){
                    mConnectWin.Close();
                    btnCall.IsEnabled = true;
                }), null);
            }
        }
    }
}
