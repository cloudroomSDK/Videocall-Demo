Component({

    /**
     * 组件的初始数据
     */
    data: {
        isShow: false,
        modalTitle: null,
        modalMsg: null,
        placeholder: null,
        inputValue: null,
        showCancel: null,
        zIndex: 1,
    },

    /**
     * 组件的方法列表
     */
    methods: {
        //隐藏弹框
        hideModal() {
            this.setData({ isShow: false })
        },
        //展示弹框
        showModal(config) {
            this.confirmFn = config.confirm;
            this.cancelFn = config.cancel;
            this.setData({
                type: config.type,
                modalMsg: config.content,
                placeholder: config.placeholder,
                inputValue: '',
                isShow: true,
                zIndex: typeof config.zIndex === 'number' ? config.zIndex : 1,
                showCancel: config.showCancel === undefined ? true : config.showCancel
            })
        },
        _cancelEvent() {
            //触发取消回调
            this.hideModal();
            this.cancelFn && this.cancelFn();
        },
        _confirmEvent() {
            //触发成功回调
            this.hideModal();
            this.confirmFn && this.confirmFn(this.data.inputValue || null);
        },
        bindKeyInput(e) {
            this.setData({
                inputValue: e.detail.value
            });
        }
    }
})
