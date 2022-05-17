namespace VideoCall
{
    partial class CR_SDK_VideoCall
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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(CR_SDK_VideoCall));
            this.axCRVideoSDK = new AxnpcloudroomvideosdkLib.AxCloudroomVideoSDK();
            ((System.ComponentModel.ISupportInitialize)(this.axCRVideoSDK)).BeginInit();
            this.SuspendLayout();
            // 
            // axCRVideoSDK
            // 
            this.axCRVideoSDK.Enabled = true;
            this.axCRVideoSDK.Location = new System.Drawing.Point(71, 33);
            this.axCRVideoSDK.Name = "axCRVideoSDK";
            this.axCRVideoSDK.OcxState = ((System.Windows.Forms.AxHost.State)(resources.GetObject("axCRVideoSDK.OcxState")));
            this.axCRVideoSDK.Size = new System.Drawing.Size(75, 23);
            this.axCRVideoSDK.TabIndex = 3;
            // 
            // CR_SDK_VideoCall
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.axCRVideoSDK);
            this.Name = "CR_SDK_VideoCall";
            this.Size = new System.Drawing.Size(149, 84);
            ((System.ComponentModel.ISupportInitialize)(this.axCRVideoSDK)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private AxnpcloudroomvideosdkLib.AxCloudroomVideoSDK axCRVideoSDK;

    }
}
