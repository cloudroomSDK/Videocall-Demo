using System;
using System.Collections.Generic;
using System.Windows;
using Newtonsoft.Json;
using System.Collections.ObjectModel;
using AxnpcloudroomvideosdkLib;
using System.Windows.Controls.Primitives;

namespace SDKDemo
{
    /// <summary>
    /// Service.xaml 的交互逻辑
    /// </summary>
    public partial class ServiceWin : Window
    {
        private ConnectWin mConnectWin;
        private UserInfo mPeerUser;
        private bool bIsDND = false; //是否是免打扰模式
        private delegate void messageBoxDelegate(string desc);
        private void BeginInvokeMessageBox(string desc) { MessageBox.Show(this, desc); }
        private Dictionary<int, int> queRows = new Dictionary<int, int>();  //队列所在界面上的行

        ObservableCollection<QueueStatusItem> queStatusList = new ObservableCollection<QueueStatusItem>();

        internal ObservableCollection<QueueStatusItem> QueueStatusItemList
        {
            get { return queStatusList; }
            set { queStatusList = value; }
        }

        public ServiceWin()
        {
            InitializeComponent();
            initServiceDelegate(true);
        }

        private void initServiceDelegate( bool isInit)
        {
            if(isInit)
            {
                App.CRVideoCall.VideoSDK.setDNDStatusSuccess += setDNDStatusSucceed;
                App.CRVideoCall.VideoSDK.setDNDStatusFail += setDNDStatusFailed;
                App.CRVideoCall.VideoSDK.createMeetingSuccess += createMeetingSuccess;
                App.CRVideoCall.VideoSDK.createMeetingFail += createMeetingFail;
                App.CRVideoCall.VideoSDK.queueStatusChanged += queueStatusChanged;
                App.CRVideoCall.VideoSDK.startServiceRslt += startServiceRslt;
                App.CRVideoCall.VideoSDK.stopServiceRslt += stopServiceRslt;
                App.CRVideoCall.VideoSDK.autoAssignUser += autoAssignUser;
                App.CRVideoCall.VideoSDK.reqAssignUserRslt += reqAssignUserRslt;
                App.CRVideoCall.VideoSDK.responseAssignUserRslt += responseAssignUserRslt;
                App.CRVideoCall.VideoSDK.cancelAssignUser += cancelAssignUser;
                App.CRVideoCall.VideoSDK.callSuccess += callSuccess;
                App.CRVideoCall.VideoSDK.callFail += callFailed;
                App.CRVideoCall.VideoSDK.notifyCallAccepted += notifyCallAccepted;
                App.CRVideoCall.VideoSDK.notifyCallRejected += notifyCallRejected;
            }
            else 
            {
                App.CRVideoCall.VideoSDK.setDNDStatusSuccess -= setDNDStatusSucceed;
                App.CRVideoCall.VideoSDK.setDNDStatusFail -= setDNDStatusFailed;
                App.CRVideoCall.VideoSDK.createMeetingSuccess -= createMeetingSuccess;
                App.CRVideoCall.VideoSDK.createMeetingFail -= createMeetingFail;
                App.CRVideoCall.VideoSDK.queueStatusChanged -= queueStatusChanged;
                App.CRVideoCall.VideoSDK.startServiceRslt -= startServiceRslt;
                App.CRVideoCall.VideoSDK.stopServiceRslt -= stopServiceRslt;
                App.CRVideoCall.VideoSDK.autoAssignUser -= autoAssignUser;
                App.CRVideoCall.VideoSDK.reqAssignUserRslt -= reqAssignUserRslt;
                App.CRVideoCall.VideoSDK.responseAssignUserRslt -= responseAssignUserRslt;
                App.CRVideoCall.VideoSDK.cancelAssignUser -= cancelAssignUser;
                App.CRVideoCall.VideoSDK.callSuccess -= callSuccess;
                App.CRVideoCall.VideoSDK.callFail -= callFailed;
                App.CRVideoCall.VideoSDK.notifyCallAccepted -= notifyCallAccepted;
                App.CRVideoCall.VideoSDK.notifyCallRejected -= notifyCallRejected;
            }
        }

         public void setNickName(string nickName)
        {
            tb_nickname.Text = "欢迎" + nickName + "...";
        }
        //加载队列数据
        public void setQueues(List<QueueInfo> queues)
        {
            queRows.Clear();
            QueueStatusItemList.Clear();
            for (int i = 0; i < queues.Count; i++)
            {
                QueueInfo que = queues[i];
                QueueStatus queState = JsonConvert.DeserializeObject<QueueStatus>(App.CRVideoCall.VideoSDK.getQueueStatus(que.queID));
                if(isServing(que.queID))
                {
                    QueueStatusItemList.Add(new QueueStatusItem(que.name, que.queID, queState.agent_num, queState.wait_num, queState.srv_num, que.prio, true, "服务中…"));
                }
                else
                {
                    QueueStatusItemList.Add(new QueueStatusItem(que.name, que.queID, 0, 0, 0, que.prio, false, "请开启服务"));
                }
                queRows.Add(que.queID, i);
            }
            listView.ItemsSource = QueueStatusItemList;
        }

        public void setDNDStatusSucceed(object sender, ICloudroomVideoSDKEvents_setDNDStatusSuccessEvent e)
        {
            if(bIsDND)
            {
                btnNext.Visibility = Visibility.Visible;
            }
            else
            {
                btnNext.Visibility = Visibility.Hidden;
            }
            Console.WriteLine("setDNDStatusSucceed");
        }

        public void setDNDStatusFailed(object sender, ICloudroomVideoSDKEvents_setDNDStatusFailEvent e)
        {
            Console.WriteLine("setDNDStatusFailed: " + e.p_sdkErr);
            cbkSetDND.IsChecked = !cbkSetDND.IsChecked;

            this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "设置免打扰失败：" + CRError.Instance.getError(e.p_sdkErr) });
        }

        public void queueStatusChanged(object sender, ICloudroomVideoSDKEvents_queueStatusChangedEvent e)
        {
            Console.Write("queueStatusChanged: " + e.p_jsonQueStatus);
            QueueStatus state = JsonConvert.DeserializeObject<QueueStatus>(e.p_jsonQueStatus);
            Console.WriteLine("queID:" + state.queID + ", agent_num:" + state.agent_num + ", wait_num:" + state.wait_num + ", srv_num:" + state.srv_num);

            if (queRows.ContainsKey(state.queID) == false)
                return;

            //更新队列数据
            int row = queRows[state.queID];
            if (!isServing(state.queID))
            {
                QueueStatusItemList[row].Agent_num = 0;
                QueueStatusItemList[row].Wait_num = 0;
                QueueStatusItemList[row].Srv_num = 0;
                QueueStatusItemList[row].IsServing = false;
                QueueStatusItemList[row].ServiceDesc = "请开启服务";
            }
            else
            {
                QueueStatus queState = JsonConvert.DeserializeObject<QueueStatus>(App.CRVideoCall.VideoSDK.getQueueStatus(state.queID));
                QueueStatusItemList[row].Agent_num = queState.agent_num;
                QueueStatusItemList[row].Wait_num = queState.wait_num;
                QueueStatusItemList[row].Srv_num = queState.srv_num;
                QueueStatusItemList[row].IsServing = true;
                QueueStatusItemList[row].ServiceDesc = "服务中…";
            }
        }

        public void startServiceRslt(object sender, ICloudroomVideoSDKEvents_startServiceRsltEvent e)
        { 
            Console.WriteLine("startServiceRslt, queID:" + e.p_queID + ", err:" + e.p_sdkErr);
        }

        public void stopServiceRslt(object sender, ICloudroomVideoSDKEvents_stopServiceRsltEvent e)
        {
            if(e.p_sdkErr == 0)
            {
                if (queRows.ContainsKey(e.p_queID) == false)
                    return;

                //更新队列数据
                int row = queRows[e.p_queID];
                if (!isServing(e.p_queID))
                {
                    QueueStatusItemList[row].Agent_num = 0;
                    QueueStatusItemList[row].Wait_num = 0;
                    QueueStatusItemList[row].Srv_num = 0;
                    QueueStatusItemList[row].IsServing = false;
                    QueueStatusItemList[row].ServiceDesc = "请开启服务";
                }
                else
                {
                    QueueStatus queState = JsonConvert.DeserializeObject<QueueStatus>(App.CRVideoCall.VideoSDK.getQueueStatus(e.p_queID));
                    QueueStatusItemList[row].Agent_num = queState.agent_num;
                    QueueStatusItemList[row].Wait_num = queState.wait_num;
                    QueueStatusItemList[row].Srv_num = queState.srv_num;
                    QueueStatusItemList[row].IsServing = true;
                    QueueStatusItemList[row].ServiceDesc = "服务中…";
                }
            }
            else
            {
                this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "停止服务失败：" + CRError.Instance.getError(e.p_sdkErr) });
            }
            Console.WriteLine("stopServiceRslt, queID:" + e.p_queID + ", err:" + e.p_sdkErr);
        }

        public void autoAssignUser(object sender, ICloudroomVideoSDKEvents_autoAssignUserEvent e)
        {
            mPeerUser = JsonConvert.DeserializeObject<UserInfo>(e.p_jsonUsr);

            this.Dispatcher.BeginInvoke((Action)delegate()
            {
                setServeUser(mPeerUser);
            });
            
        }

        public void responseAssignUserRslt(object sender, ICloudroomVideoSDKEvents_responseAssignUserRsltEvent e)
        {
            Console.WriteLine("responseAssignUserRslt:" + e.p_sdkErr);
        }
        //服务端取消已经分配的用户，关闭本地连接窗口
        public void cancelAssignUser(object sender, ICloudroomVideoSDKEvents_cancelAssignUserEvent e)
        {
            Console.WriteLine("cancelAssignUser:" + e.p_usrID);
            mPeerUser.usrID = "";
            mConnectWin.Close();
        }

        public void callSuccess(object sender, ICloudroomVideoSDKEvents_callSuccessEvent e)
        {
            Console.WriteLine("callSuccess:" + e.p_callID);
        }

        public void callFailed(object sender, ICloudroomVideoSDKEvents_callFailEvent e)
        {
            Console.WriteLine("callFailed, error:" + e.p_sdkErr + ", callID:" + e.p_callID);

            this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "呼叫失败，代码：" + CRError.Instance.getError(e.p_sdkErr) });
        }

        public void notifyCallAccepted(object sender, ICloudroomVideoSDKEvents_notifyCallAcceptedEvent e)
        {
            Console.WriteLine("notifyCallAccepted");

            MeetObj meet = JsonConvert.DeserializeObject<MeetObj>(e.p_meetObj);
            App.CRVideoCall.VideoSDK.enterMeeting3(meet.ID);
            Login.Instance.startVideoSession(e.p_callID, mPeerUser.usrID, meet.ID);            
        }
        //对方拒绝会话邀请，本demo中对方默认直接接受，所有此委托不会被调用
        public void notifyCallRejected(object sender, ICloudroomVideoSDKEvents_notifyCallRejectedEvent e)
        {
            Console.WriteLine("notifyCallRejected:" + e.p_reason);
        }

        public void reqAssignUserRslt(object sender, ICloudroomVideoSDKEvents_reqAssignUserRsltEvent e)
        {
            Console.WriteLine("reqAssignUserRslt:" + e.p_sdkErr);
            if (e.p_sdkErr == (int)VCALLSDK_ERR_DEF.VCALLSDK_NOERR)
            {
                this.Dispatcher.BeginInvoke((Action)delegate()
                {
                    mPeerUser = JsonConvert.DeserializeObject<UserInfo>(e.p_jsonUsr);
                    createMeeting();
          
                });
            }
            else if(e.p_sdkErr == (int)VCALLSDK_ERR_DEF.VCALLSDK_QUE_NOUSER)
            {             
                this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "队列中没有排队人员" });
                btnNext.IsEnabled = true;
            }
            else
            {
                this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "手动获取用户失败，请重试， 代码：" + CRError.Instance.getError(e.p_sdkErr) });
                btnNext.IsEnabled = true;
            }
            
        }

        public void lineOff()
        {
            if(mConnectWin!=null)
            {
                mConnectWin.Close();
            }

            this.Close();
        }

        private void btnNext_Click(object sender, RoutedEventArgs e)
        {
            btnNext.IsEnabled = false;
            App.CRVideoCall.VideoSDK.reqAssignUser("");
        }

        private void btnLogout_Click(object sender, RoutedEventArgs e)
        {
            this.Close();      
        }

        private void cbkSetDND_Checked(object sender, RoutedEventArgs e)
        {
            if (cbkSetDND.IsChecked == true)   //免打扰，手动分配
            {
                App.CRVideoCall.VideoSDK.setDNDStatus(1, "");
                bIsDND = true;
            }
            else
            {
                App.CRVideoCall.VideoSDK.setDNDStatus(0, "");
                bIsDND = false;
            }
        }

        private bool isServing(int queID)
        {
            string str = App.CRVideoCall.VideoSDK.getServingQueues();
            string[] queIDs = str.Split('\n');
            for (int i = 0; i < queIDs.Length; i++)
            {
                if (queIDs[i] != "" && queID == Convert.ToInt32(queIDs[i]))
                    return true;
            }
            return false;
        }

        private void createMeeting()
        {
            App.CRVideoCall.VideoSDK.createMeeting2("", "");
        }

        public void createMeetingSuccess(object sender, ICloudroomVideoSDKEvents_createMeetingSuccessEvent e)
        {
            btnNext.IsEnabled = true;
            if (mPeerUser.usrID.Length <= 0)
                return;
            Console.WriteLine("创建会议成功，开始呼叫邀请" + mPeerUser.usrID);
            callUserForMeeting(e.p_meetObj);
        }

        public void createMeetingFail(object sender, ICloudroomVideoSDKEvents_createMeetingFailEvent e)
        {
            btnNext.IsEnabled = true;
            if (mPeerUser.usrID.Length <= 0)
                return;
            Console.WriteLine("createMeetingFail, rejectAssignUser...");
            App.CRVideoCall.VideoSDK.rejectAssignUser(mPeerUser.queID, mPeerUser.usrID, e.p_cookie);

            this.Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "创建会议失败，无法继续邀请, 自动拒绝已分配的客户，代码：" + CRError.Instance.getError(e.p_sdkErr) });
        }

        private void setServeUser(UserInfo user)
        {
            if ( cbkSetDND.IsChecked==false )  //自动分配
            {
                mConnectWin = new ConnectWin();
                mConnectWin.Owner = this;
                mConnectWin.setUser(mPeerUser.name);

                mConnectWin.ShowDialog();
                ConnectWin.CLOSE_REASON reason = mConnectWin.getCloseReason();
                if (reason==ConnectWin.CLOSE_REASON.CLOSE_BY_REJECT)
                {
                    Console.WriteLine("rejectAssignUser");
                    App.CRVideoCall.VideoSDK.rejectAssignUser(mPeerUser.queID, mPeerUser.usrID, "");
                    return;
                }
                else if (reason == ConnectWin.CLOSE_REASON.CLOSE_BY_CANCEL)
                {
                    return;
                }
            }

            createMeeting();
        }

        private void callUserForMeeting(string meetObj)
        {
            Console.WriteLine("acceptAssignUser");

            App.CRVideoCall.VideoSDK.acceptAssignUser(mPeerUser.queID, mPeerUser.usrID, "");

            string callID = App.CRVideoCall.VideoSDK.call(mPeerUser.usrID, meetObj, "", ""); //无密码，无扩展参数
            Console.Write("start call " + mPeerUser.usrID + ", callID:" + callID);
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            Login.Instance.Logout();
            initServiceDelegate(false);
        }

        private void serviceBtn_Click(object sender, RoutedEventArgs e)
        {
            ToggleButton btn = (ToggleButton)sender;
            int queID = (int)btn.CommandParameter;
            if (isServing(queID))
            {
                App.CRVideoCall.VideoSDK.stopService(queID, "");
            }
            else
            {
                App.CRVideoCall.VideoSDK.startService(queID, "");
            }
         }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            App.CRVideoCall.VideoSDK.initQueueDat("");  //初始化专家坐席用户队列
        }

    }
}
