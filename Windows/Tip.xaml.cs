using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Timers;
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
    /// Tip.xaml 的交互逻辑
    /// </summary>
    public partial class Tip : Window
    {
        private string mText = "";
        private int mnCount = 3;
        private System.Timers.Timer timerCount = new System.Timers.Timer();

        public Tip()
        {
            InitializeComponent();
        }

        public void setText(string text)
        {
            mnCount = 3;
            mText = text;
            timerCount.Elapsed += timerCount_Elapsed;
            timerCount.Interval = 1000;
            timerCount.Enabled = true;

            timerCount.Start();
            this.Content = mText + String.Format("({0}s)", mnCount);
        }

       
        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            timerCount.Close();
        }

        public void timerCount_Elapsed(object sender, ElapsedEventArgs e)
        {
            mnCount--;
            this.Dispatcher.Invoke((ThreadStart)delegate(){
                this.Content = mText + String.Format("({0}s)", mnCount);
                if (mnCount <= 0)
                {
                    timerCount.Close();
                    this.Close();
                }
            }, null);
            
        }
    }
}
