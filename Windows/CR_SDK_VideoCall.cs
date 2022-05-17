using System.Windows.Forms;
using AxnpcloudroomvideosdkLib;
using System;

namespace VideoCall
{
    public partial class CR_SDK_VideoCall : UserControl
    {        
        public CR_SDK_VideoCall()
        {
            InitializeComponent();            
        }

        public AxCloudroomVideoSDK Video
        {
            get { return axCRVideoSDK; }
        }
    }
}
