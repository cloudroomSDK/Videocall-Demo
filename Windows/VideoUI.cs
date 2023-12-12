using System.Windows.Forms;
using AxnpcloudroomvideosdkLib;

namespace SDKDemo
{
    public partial class VideoUI : UserControl
    {
        public VideoUI()
        {
            InitializeComponent();

            //保持画面比例，不拉伸
            axCRVideoUI.keepAspectRatio = true;
        }

        public AxCloudroomVideoUI UI
        {
            get { return axCRVideoUI; }
        }
    }
}
