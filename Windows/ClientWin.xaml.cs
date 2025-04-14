using System.Windows;
using System.Collections.ObjectModel;
using System.Windows.Controls;
using System;
using Newtonsoft.Json;
using AxnpcloudroomvideosdkLib;
using System.Collections.Generic;

namespace SDKDemo
{
    /// <summary>
    /// Client.xaml 的交互逻辑
    /// </summary>
    public partial class ClientWin : Window
    {
        private StartQueuing mStartQueuing;
        private string mCallInCallerID;

        private delegate void messageBoxDelegate(string desc);
        private void BeginInvokeMessageBox(string desc) { MessageBox.Show(this, desc); }

        public ClientWin()
        {
            InitializeComponent();
            initClientDelegate(true);
        }

        private void initClientDelegate(bool isInit)
        {
            if(isInit)
            {
                App.CRVideoCall.VideoSDK.acceptCallSuccess += acceptCallSucceed;
                App.CRVideoCall.VideoSDK.acceptCallFail += acceptCallFailed;
                App.CRVideoCall.VideoSDK.queueStatusChanged += queueStatusChanged;
                App.CRVideoCall.VideoSDK.queuingInfoChanged += queuingInfoChanged;
                App.CRVideoCall.VideoSDK.startQueuingRslt += startQueuingRslt;
                App.CRVideoCall.VideoSDK.stopQueuingRslt += stopQueuingRslt;
                App.CRVideoCall.VideoSDK.notifyCallIn += notifyCallIn;
            }
            else 
            {
                App.CRVideoCall.VideoSDK.acceptCallSuccess -= acceptCallSucceed;
                App.CRVideoCall.VideoSDK.acceptCallFail -= acceptCallFailed;
                App.CRVideoCall.VideoSDK.queueStatusChanged -= queueStatusChanged;
                App.CRVideoCall.VideoSDK.queuingInfoChanged -= queuingInfoChanged;
                App.CRVideoCall.VideoSDK.startQueuingRslt -= startQueuingRslt;
                App.CRVideoCall.VideoSDK.stopQueuingRslt -= stopQueuingRslt;
                App.CRVideoCall.VideoSDK.notifyCallIn -= notifyCallIn;
            }
        }

        public void setNickName(string nickName)
        {
            tb_nickname.Text = "欢迎 " + nickName + "...";
        }

        public void setQueues(List<QueueInfo> queues)
        {
            QueuingInfo queuing = JsonConvert.DeserializeObject<QueuingInfo>(App.CRVideoCall.VideoSDK.getQueuingInfo());
            string queuingName = "";

            queues_panel.Children.Clear();
            for (int i = 0; i < queues.Count; i++)
            {
                QueueInfo que = queues[i];
                QueueStatus queStatus = JsonConvert.DeserializeObject<QueueStatus>(App.CRVideoCall.VideoSDK.getQueueStatus(que.queID));
                ClientQueueItem item = new ClientQueueItem(que.queID);
                item.queName.Text = que.name;
                item.queDesc.Text = que.desc;
                item.quePeople.Text = String.Format("({0}人)", queStatus.wait_num);
                item.QueueItemClick +=new RoutedEventHandler(item_QueueItemClick);

                queues_panel.Children.Add(item);

                //正在排的队列的名称
                if (que.queID == queuing.queID)
                {
                    queuingName = que.name;
                }
            }

            if (queuing.queID > 0)
            {
                mStartQueuing = new StartQueuing();
                mStartQueuing.setQueueName(queuingName);
                mStartQueuing.updateQueuingDesc(queuing.position, queuing.queuingTime);
                mStartQueuing.ShowDialog();
            }
        }

        public void acceptCallSucceed(object sender, ICloudroomVideoSDKEvents_acceptCallSuccessEvent e)
        {
            Console.WriteLine("acceptCallSucceed");
            MeetObj meet = JsonConvert.DeserializeObject<MeetObj>(e.p_cookie);
            
            App.CRVideoCall.VideoSDK.enterMeeting3(meet.ID);

            this.Dispatcher.BeginInvoke((Action)delegate()
            {
                Login.Instance.startVideoSession(e.p_callID, mCallInCallerID);
            });
            //打开会话界面
        }

        public void acceptCallFailed(object sender, ICloudroomVideoSDKEvents_acceptCallFailEvent e)
        {
            Dispatcher.BeginInvoke(new messageBoxDelegate(BeginInvokeMessageBox), new object[] { "接收视频会话失败，代码：" + CRError.Instance.getError(e.p_sdkErr) });
        }

        public void queueStatusChanged(object sender, ICloudroomVideoSDKEvents_queueStatusChangedEvent e)
        {
            foreach (ClientQueueItem item in queues_panel.Children)
            {
                int queID = Convert.ToInt32(item.Tag);
                QueueStatus state = JsonConvert.DeserializeObject<QueueStatus>(e.p_jsonQueStatus);
                if (state.queID == queID)
                {
                    Console.WriteLine(String.Format("queueStatusChanged:{0}, agent:{1}, srv_num{2}, wait_time:{3}", state.queID, state.agent_num, state.srv_num, state.wait_num));
                    item.quePeople.Text = String.Format("({0}人)", state.wait_num);
                    break;
                }
            }
        }

        public void queuingInfoChanged(object sender, ICloudroomVideoSDKEvents_queuingInfoChangedEvent e)
        {
            QueuingInfo queuingInfo = JsonConvert.DeserializeObject<QueuingInfo>(e.p_queuingInfo);
            Console.WriteLine("queuingInfoChanged: " + queuingInfo.queID + ", position:" + queuingInfo.position + ", wait_time:" + queuingInfo.queuingTime);
            if (mStartQueuing != null)
            {
                mStartQueuing.updateQueuingDesc(queuingInfo.position, queuingInfo.queuingTime);
            }
        }

        public void startQueuingRslt(object sender, ICloudroomVideoSDKEvents_startQueuingRsltEvent e)
        {
            Console.WriteLine("startQueuingRslt: " + e.p_sdkErr);
            if (e.p_sdkErr != 0)
            {
                mStartQueuing.Close();

            }
        }

        public void stopQueuingRslt(object sender, ICloudroomVideoSDKEvents_stopQueuingRsltEvent e)
        {
            Console.WriteLine("stopQueuingRslt: " + e.p_sdkErr);
        }

        public void notifyCallIn(object sender, ICloudroomVideoSDKEvents_notifyCallInEvent e)
        {
            Console.WriteLine("notifyCallIn: " + e.p_callID + ", caller:" + e.p_callerID + ", meetObj:" + e.p_meetObj);
            Console.WriteLine("---------------enter meeting--------" + e.p_meetObj);

            //关闭排队窗口
            mStartQueuing.Hide();
            mStartQueuing.Close();

            mCallInCallerID = e.p_callerID;
            App.CRVideoCall.VideoSDK.acceptCall(e.p_callID, e.p_meetObj, "test param", e.p_meetObj);  
        }

        public void lineOff()
        {
            if (mStartQueuing != null)
            {
                mStartQueuing.Close();
            }
            Close();
        }

        //单击开始排队
        private void item_QueueItemClick(object sender, RoutedEventArgs e)
        {
            QueueItemClickRoutedEventArgs arg = (QueueItemClickRoutedEventArgs)e;

            Console.WriteLine("startqueuing: " + arg.queID + ", name:" + arg.Name);
            App.CRVideoCall.VideoSDK.startQueuing(arg.queID, "testString");
  
            mStartQueuing = new StartQueuing();
           
            mStartQueuing.setQueueName(arg.Name);
            mStartQueuing.Owner = this;
            mStartQueuing.ShowDialog();
        }

        //注销，回到登陆页面
        private void btnLogout_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void btnUpdate_Click(object sender, RoutedEventArgs e)
        {
            App.CRVideoCall.VideoSDK.initQueueDat("");  //初始化专家坐席用户队列
            //App.CRVideoCall.Video.refreshAllQueueStatus();
        }

        //关闭窗口时注销
        private void Window_Closed(object sender, EventArgs e)
        {
            if (mStartQueuing != null)
            {
                mStartQueuing.Close();
            }
            Login.Instance.Logout();
            initClientDelegate(false);
        }
    }
}
