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
using System.IO;

namespace VideoCall
{
    /// <summary>
    /// SendCmdWin.xaml 的交互逻辑
    /// </summary>
    public partial class SendCmdWin : Window
    {
        public SendCmdWin( string peerID)
        {
            InitializeComponent();

            txtCmdReceiver.Text = peerID;
            txtFileReceiver.Text = peerID;

            txtCmdReceiver.IsEnabled = false;
            txtFileReceiver.IsEnabled = false;
        }

        private void btnSendCmd_Click(object sender, RoutedEventArgs e)
        {
            if (txtCmdData.Text.Trim() == "")
            {
                System.Windows.MessageBox.Show(this, "请输入要发送的数据");
                return;
            }
            if (txtCmdReceiver.Text.Trim() == "")
            {
                System.Windows.MessageBox.Show(this, "请输入数据接收者的ID");
                return;
            }

            App.CRVideoCall.Video.sendCmd(txtCmdReceiver.Text.Trim(), txtCmdData.Text.Trim());
            GC.Collect();
        }

        //测试文件数据
        private string mSelectedFile;
        private void btnSelectFile_Click(object sender, RoutedEventArgs e)
        {
            System.Windows.Forms.OpenFileDialog openDlg = new System.Windows.Forms.OpenFileDialog();
            openDlg.Filter = "All files (*.*)|*.*";
            openDlg.RestoreDirectory = true;
            if (openDlg.ShowDialog() == System.Windows.Forms.DialogResult.OK)
            {
                mSelectedFile = openDlg.FileName;
            }
            else
            {
                mSelectedFile = "";
            }

            txtSelectedFile.Text = mSelectedFile;
            txtSelectedFile.IsReadOnly = true;
        }

        private string mBufferTaskID = "";

        private void sendFileBuffer()
        {
            if (txtSelectedFile.Text == "")
            {
                System.Windows.MessageBox.Show(this, "请选择需要发送的文件");
                return;
            }
            if (txtFileReceiver.Text == "")
            {
                System.Windows.MessageBox.Show(this, "请添加文件接收者");
                return;
            }
          
            using (FileStream stream = new FileInfo(mSelectedFile).OpenRead())
            {
                label_sendBuffer_desc.Text = "文件大小：" + stream.Length / 1000 + "KB";
            }

            mBufferTaskID = (string)App.CRVideoCall.Video.sendFile(txtFileReceiver.Text.Trim(), mSelectedFile);
        }

        public void sendProgress(int totalLen, int sendedLen)
        {
            label_sendBuffer_desc.Text = "总大小：" + totalLen + ", 已发送" + sendedLen;            
            if (mBufferTaskID != "")
            {
                btnSendFile.Content = "取消发送 ";
            }

            //发完了，清空本次发送信息
            if (sendedLen == totalLen)
            {
                mBufferTaskID = "";
                btnSendFile.Content = "发送文件 ";
                label_sendBuffer_desc.Text = "发送成功";
            }
        }

        public void sendCmdRlst(int err)
        {
            if (mBufferTaskID != "")
            {
                btnSendCmd.Content = "取消发送";
            }
        }

        public void sendFileRlst(int err)
        {
            mBufferTaskID = "";
        }

        public void cancelSendRlst(int err)
        {
            btnSendFile.Content = "发送文件";
            mBufferTaskID = "";
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            this.Hide();
            e.Cancel = true;
        }

        private void btnSendFile_Click(object sender, RoutedEventArgs e)
        {
            if (mBufferTaskID != "")
            {
                App.CRVideoCall.Video.cancelSend(mBufferTaskID);
                label_sendBuffer_desc.Text = "发送已取消";
            }
            else
            {
                sendFileBuffer();
            }
        }

     
    }
}
