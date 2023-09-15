const sdkErrDesc = require('../../utils/sdkErrDesc');
const app = getApp(); // 获取app实例
const RTCSDK = require('../../utils/RTCSDK/RTC_Miniapp_SDK.min.js');
const Tools = require('../../utils/tools')
const md5 = RTCSDK.MD5; // 引入md5工具
Page({

    /**
     * 页面的初始数据
     */
    data: {
        nickname: '', // 昵称
        userID: '', // 用户ID
        ver: '', // demo版本
        sdkVer: '', // sdk版本
        loginType: 1, // 登录类型   1客户 2坐席
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if (options.Toast) Tools.showToast(options.Toast, 3000);

        this.setData({
            ver: app.globalData.ver,
            sdkVer: app.globalData.sdkVer,
            nickname: app.globalData.userInfo.nickname, // 昵称
            userID: app.globalData.userInfo.UID, // 用户ID
            loginType: app.globalData.userInfo.loginType, // 用户类型
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return Tools.defaultShare();
    },

    /* *************** 登录服务器设置相关 *************** */
    // 显示服务器设置界面
    showSet(e) {

        wx.navigateTo({ // 跳转到服务器设置页面
            url: '../setting/setting'
        })
    },

    /* *************** 登录操作 *************** */
    // 输入昵称
    nicknameInput(e) {
        this.setData({
            nickname: e.detail.value // 保存昵称
        })
    },
    // 选择登录类型：客户/坐席
    loginTypeChange(e) {
        this.setData({
            loginType: +e.detail.value // 保存登录类型
        })
    },
    // 点击登录按钮
    login(e) {
        if (!app.globalData.SDKInitStatus) {
            Tools.showToast('SDK初始化失败，请重启小程序'); // 弹出提示层
            return;
        }
        const nickName = this.data.nickname;
        const UID = nickName;

        if (!nickName) {
            Tools.showToast('昵称不能为空', 1000) // 弹出提示层
            return;
        }
        // 弹出正在登录加载层
        Tools.showLoading({
            title: '正在登录',
            // mask: false
        });

        app.globalData.userInfo.nickname = nickName; // 将昵称和userID保存到app.userInfo中，供全局使用
        app.globalData.userInfo.UID = UID;
        app.globalData.userInfo.loginType = this.data.loginType;
        if (app.globalData.serverCfg.useToken) {
            RTCSDK.LoginByToken(app.globalData.serverCfg.token, nickName, UID);
        } else {
            // 登录服务器
            RTCSDK.Login(app.globalData.serverCfg.AppID || app.globalData.serverCfg.defaultAppID, md5(app.globalData.serverCfg.AppSecret), nickName, UID, '');
        }
    },

    // 接收SDK回调消息
    onMessage: {
        LoginSuccess(UID, cookie) { // 登录服务器成功
            console.log('登录服务器成功...');
            wx.hideLoading(); // 隐藏加载层
            wx.navigateTo({ // 跳转到队列界面
                url: this.data.loginType === 1 ? '../clientQueue/clientQueue' : '../serverQueue/serverQueue',
            })
            wx.setStorage({
                key: 'CR_LoginType',
                data: this.data.loginType,
            })
        },
        LoginFail(sdkErr, cookie) { // 登录服务器失败
            wx.hideLoading();
            const desc = `登录服务器失败! code:${sdkErr},描述：${sdkErrDesc(sdkErr)}`;
            console.log(desc);
            Tools.showToast(desc, 3000);

        }
    }
})
