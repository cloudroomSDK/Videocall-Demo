using System;
using System.IO;
using System.Text;
using System.Windows;

namespace SDKDemo
{
    /// <summary>
    /// Set.xaml 的交互逻辑
    /// </summary>
    public partial class Set : Window
    {
        private bool mIsPasswrodChanged = false;
        public Set(Window parent)
        {
            InitializeComponent();

            this.Owner = parent;
            ShowInTaskbar = false;

            IniFile iniFile = new IniFile(Directory.GetCurrentDirectory() + "/VideoCall.ini");  //获取当前根目录
            edtServer.Text = iniFile.ReadValue("Cfg", "LastServer", "sdk.cloudroom.com");
            cbHttpType.SelectedIndex = Convert.ToInt32(iniFile.ReadValue("Cfg", "HttpType", "1"));
            edtAccount.Text = iniFile.ReadValue("Cfg", "LastAccount", "");
            edtPassword.Password = iniFile.ReadValue("Cfg", "LastPwd", "");
            if( edtAccount.Text=="" )
            {
                setDefAcnt();
            }

            mIsPasswrodChanged = false;
        }

        private void setDefAcnt()
        {
            if( AccountInfo.TEST_AppID=="" )
            {
                edtAccount.Text = "";
                edtPassword.Password = "";
            }
            else
            {
                edtAccount.Text = "默认APPID";
                edtPassword.Password = "*";
            }
        }

        //默认设置
        private void btnSet_Clicked(object sender, RoutedEventArgs e)
        {
            edtServer.Text = "sdk.cloudroom.com";
            cbHttpType.SelectedIndex = 1;
            setDefAcnt();

            save2File();
        }

        //关闭时保存设置
        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
        }

        private void edtPassword_PasswordChanged(object sender, RoutedEventArgs e)
        {
            mIsPasswrodChanged = true;
        }

        private void btnSave_Click(object sender, RoutedEventArgs e)
        {
            if (edtServer.Text.Trim() == "" || edtAccount.Text.Trim() == "" || edtPassword.Password == "")
            {
                MessageBox.Show("请完成输入！");  
                return;
            }

            save2File();
            Close();
        }

        private void save2File()
        {
            IniFile iniFile = new IniFile(Directory.GetCurrentDirectory() + "/VideoCall.ini");  //获取当前根目录
            iniFile.WriteValue("Cfg", "LastServer", edtServer.Text);
            iniFile.WriteValue("Cfg", "HttpType", cbHttpType.SelectedIndex.ToString());

            if (edtAccount.Text != "默认APPID")
            {
                iniFile.WriteValue("Cfg", "LastAccount", edtAccount.Text);
                iniFile.WriteValue("Cfg", "LastPwd", mIsPasswrodChanged ? App.getMD5Value(edtPassword.Password) : edtPassword.Password);
            }
            else
            {
                iniFile.WriteValue("Cfg", "LastAccount", null);
                iniFile.WriteValue("Cfg", "LastPwd", null);
            }
        }
    }
}
