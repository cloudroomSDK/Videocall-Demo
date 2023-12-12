namespace SDKDemo
{
    partial class VideoUI
    {
        /// <summary> 
        /// 必需的设计器变量。
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// 清理所有正在使用的资源。
        /// </summary>
        /// <param name="disposing">如果应释放托管资源，为 true；否则为 false。</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region 组件设计器生成的代码

        /// <summary> 
        /// 设计器支持所需的方法 - 不要
        /// 使用代码编辑器修改此方法的内容。
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(VideoUI));
            this.axCRVideoUI = new AxnpcloudroomvideosdkLib.AxCloudroomVideoUI();
            ((System.ComponentModel.ISupportInitialize)(this.axCRVideoUI)).BeginInit();
            this.SuspendLayout();
            // 
            // axCRVideoUI
            // 
            this.axCRVideoUI.Dock = System.Windows.Forms.DockStyle.Fill;
            this.axCRVideoUI.Enabled = true;
            this.axCRVideoUI.Location = new System.Drawing.Point(0, 0);
            this.axCRVideoUI.Name = "axCRVideoUI";
            this.axCRVideoUI.OcxState = ((System.Windows.Forms.AxHost.State)(resources.GetObject("axCRVideoUI.OcxState")));
            this.axCRVideoUI.Size = new System.Drawing.Size(150, 150);
            this.axCRVideoUI.TabIndex = 0;
            // 
            // VideoUI
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.axCRVideoUI);
            this.Name = "VideoUI";
            ((System.ComponentModel.ISupportInitialize)(this.axCRVideoUI)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private AxnpcloudroomvideosdkLib.AxCloudroomVideoUI axCRVideoUI;
    }
}
