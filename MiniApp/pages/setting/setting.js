const app = getApp();
const RTCSDK = require('../../utils/RTCSDK/RTC_Miniapp_SDK.min.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        serverAddr: '',
        AppID: '',
        AppSecret: '',
        token: '',
        useToken: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

        this.setData({
            useToken: app.globalData.serverCfg.useToken,
            serverAddr: app.globalData.serverCfg.serverAddr,
            AppID: app.globalData.serverCfg.AppID,
            AppSecret: app.globalData.serverCfg.AppSecret,
            token: app.globalData.serverCfg.token
        });
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return Tools.defaultShare();
    },
    //点击动态令牌选项
    useTokenChange(e) {
        this.setData({
            useToken: e.detail.value
        });
    },

    // 输入服务器地址
    svrAddrInput(e) {
        this.setData({
            serverAddr: e.detail.value
        });
    },
    // 输入用户名
    AppIDInput(e) {
        this.setData({
            AppID: e.detail.value
        })
    },
    // 输入密码
    pswdInput(e) {
        this.setData({
            AppSecret: e.detail.value
        })
    },
    // 输入token
    tokenInput(e) {
        this.setData({
            token: e.detail.value
        })
    },
    // 点击保存按钮
    loginSetSave(e) {
        wx.setStorage({
            key: 'CR_ServerAddr',
            data: this.data.serverAddr,
        })
        wx.setStorage({
            key: 'CR_AppID',
            data: this.data.AppID,
        })
        wx.setStorage({
            key: 'CR_AppSecret',
            data: this.data.AppSecret,
        })
        wx.setStorage({
            key: 'CR_useToken',
            data: this.data.useToken,
        })
        wx.setStorage({
            key: 'CR_token',
            data: this.data.token,
        })

        app.globalData.serverCfg['serverAddr'] = this.data.serverAddr;
        app.globalData.serverCfg['useToken'] = this.data.useToken;
        app.globalData.serverCfg['AppID'] = this.data.AppID;
        app.globalData.serverCfg['AppSecret'] = this.data.AppSecret;
        app.globalData.serverCfg['token'] = this.data.token;

        RTCSDK.SetServerAddr(this.data.serverAddr); // 设置服务器地址

        wx.navigateBack({
            delta: 1
        })

    },
    // 点击恢复默认按钮
    resetLoginCfg(e) {
        this.setData({
            serverAddr: 'sdk.cloudroom.com',
            AppID: '',
            AppSecret: '123456'
        });
    },


})
