using System.Windows.Forms;
using AxnpcloudroomvideosdkLib;
using System;

namespace SDKDemo
{
    public partial class CR_SDK_VideoCall : UserControl
    {        
        public CR_SDK_VideoCall()
        {
            InitializeComponent();            
        }

        public AxCloudroomVideoSDK VideoSDK
        {
            get { return axCRVideoSDK; }
        }
    }
}
