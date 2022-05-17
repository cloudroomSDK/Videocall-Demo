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
    /// SelectPage.xaml 的交互逻辑
    /// </summary>
    public partial class SelectPage : Window
    {
        private int? m_rslt = null;
        public SelectPage()
        {
            InitializeComponent();
        }

        public int? getRslt()
        {
            return m_rslt;
        }
        private void btn_direct_call_click(object sender, RoutedEventArgs e)
        {
            m_rslt = 1;
            Close();
        }

        private void btn_queue_call_click(object sender, RoutedEventArgs e)
        {
            m_rslt = 2;
            Close();
        }
    }
}
