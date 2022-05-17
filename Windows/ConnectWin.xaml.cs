using System;
using System.Windows;

namespace VideoCall
{
    /// <summary>
    /// ConnectWin.xaml 的交互逻辑
    /// </summary>
    public partial class ConnectWin : Window
    {
        public enum CLOSE_REASON
        {
            CLOSE_BY_ACCEPT = 0,
            CLOSE_BY_REJECT,
            CLOSE_BY_CANCEL
        }

        private CLOSE_REASON closeReason;
        public CLOSE_REASON getCloseReason()
        {
            return closeReason;
        }

        public ConnectWin()
        {
            closeReason = CLOSE_REASON.CLOSE_BY_REJECT;// CLOSE_BY_REJECT;
            InitializeComponent();
        }

        public void setTitle(string title)
        {
            this.Title = title;
        }
        public void setUser(string userID)
        {
            tb_desc.Text = String.Format("系统为您分配【{0}】...", userID);
        }

        public void setUser_call(string userID)
        {
            tb_desc.Text = String.Format("【{0}】正在呼叫您...", userID);
        }

        public void closeDlgByCancel()
        {
            closeReason = CLOSE_REASON.CLOSE_BY_CANCEL;
            Close();
        }

        private void btnAccept_Click(object sender, RoutedEventArgs e)
        {
            //mIsAccept = true;
            closeReason = CLOSE_REASON.CLOSE_BY_ACCEPT;
            Close();
        }

        private void btnReject_Click(object sender, RoutedEventArgs e)
        {
            //mIsAccept = false;
            closeReason = CLOSE_REASON.CLOSE_BY_REJECT;
            Close();
        }
    }
}
