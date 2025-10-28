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

namespace SDKDemo
{
    /// <summary>
    /// SelectPage.xaml 的交互逻辑
    /// </summary>
    public partial class SelectPage : Window
    {
        public enum Type{
            TP_FUNC,
            TP_ROLE
        }
        private int? m_rslt = null;
        public SelectPage(Type t)
        {
            InitializeComponent();
            if (t == Type.TP_FUNC)
            {
                this.Title = "功能选择";
                btn1.Content = "排队叫号";
                btn2.Content = "直接呼叫";
            }
            else
            {
                this.Title = "角色选择";
                btn1.Content = "座席";
                btn2.Content = "客户";
            }
        }

        public int? getRslt()
        {
            return m_rslt;
        }
        private void btn1_click(object sender, RoutedEventArgs e)
        {
            m_rslt = 1;
            Close();
        }

        private void btn2_click(object sender, RoutedEventArgs e)
        {
            m_rslt = 2;
            Close();
        }
    }
}
