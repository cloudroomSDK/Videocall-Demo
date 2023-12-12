using System;
using System.Windows;
using System.Windows.Forms;

namespace SDKDemo
{
    /// <summary>
    /// StartQueuing.xaml 的交互逻辑
    /// </summary>
    public partial class StartQueuing : Window
    {        
        private int mCurrentCount;
        private Timer mCountTimer = new Timer();

        public StartQueuing()
        {
            InitializeComponent();

            mCountTimer.Interval = 1000;
            mCountTimer.Tick += new EventHandler(Tick);
        }

        public void setQueueName(string name)
        {
            tb_queName.Text = "【" + name + "】";
        }

        public void updateQueuingDesc(int position, int wait_time)
        {
            mCurrentCount = wait_time;
            if (position > 0)
                position--;
            if (position == 0)
            {
                tb_position.Text = "您已排到最前，请耐心等候……";
            }
            else
            {
                tb_position.Text = String.Format("排队中，您前方还有{0}人", position);
            }
            mCountTimer.Start();
        }
        //本地计时
        private void Tick(object sender, EventArgs e)
        {
            mCurrentCount++;

            int h, m, s;
            h = m = s = 0;

            h = mCurrentCount / 3600;
            m = (mCurrentCount - h * 3600) / 60;
            s = mCurrentCount - h * 3600 - m * 60;

            String tickStr = "";
            if (h > 0)
            {
                tickStr += h + "时";
            }
            if (m > 0)
            {
                tickStr += m + "分";
            }
            if (s > 0)
            {
                tickStr += s + "秒";
            }

            tb_waitTime.Text = String.Format("排队中，已等待时间：{0}", tickStr);
        }

        private void btnCancel_Click(object sender, RoutedEventArgs e)
        {
            App.CRVideoCall.Video.stopQueuing("");
            Close();
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            App.CRVideoCall.Video.stopQueuing("");
            mCountTimer.Stop();
            tb_queName.Text = "";
            tb_waitTime.Text = String.Format("排队中，已等待时间：{0}", "", 0);
        }
    }
}
