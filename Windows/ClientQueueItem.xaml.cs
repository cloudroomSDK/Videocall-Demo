using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System;

namespace VideoCall
{
    /// <summary>
    /// ClientQueueItem.xaml 的交互逻辑
    /// </summary>
    public partial class ClientQueueItem : UserControl
    {
        //声明和注册路由事件\
        public static readonly RoutedEvent QueueItemClickRoutedEvent =
            EventManager.RegisterRoutedEvent("ReportTime", RoutingStrategy.Bubble, typeof(EventHandler<QueueItemClickRoutedEventArgs>), typeof(ClientQueueItem));

        public event RoutedEventHandler QueueItemClick
        {
            add { this.AddHandler(QueueItemClickRoutedEvent, value); }
            remove { this.RemoveHandler(QueueItemClickRoutedEvent, value); }
        }

        public int queID;
        public ClientQueueItem(int id)
        {
            queID = id;
            InitializeComponent();
        }

        private void UserControl_MouseUp(object sender, MouseButtonEventArgs e)
        {
            base.OnMouseUp(e);

            QueueItemClickRoutedEventArgs args = new QueueItemClickRoutedEventArgs(QueueItemClickRoutedEvent, this);
            args.queID = queID;
            args.Name = queName.Text;

            this.RaiseEvent(args);//UIElement及其派生类 
        }
    }

    //事件参数
    class QueueItemClickRoutedEventArgs : RoutedEventArgs
    {
        public QueueItemClickRoutedEventArgs(RoutedEvent routedEvent, object source) : base(routedEvent, source) { }

        public int queID { get; set; }

        public string Name { get; set; }
    }
}
