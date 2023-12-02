const RTCSDK = require('./utils/RTCSDK/RTC_Miniapp_SDK.min.js');
// const RTCSDK = require('./utils/RTCSDK/crsdk/sdkApi');
const Tools = require('./utils/tools');

App({

    globalData: {
        ver: '1.6.1', // demo版本
        sdkVer: RTCSDK.sdkver, // SDK版本
        curMeetId: null, // 当前房间
        pusherDebug: false, // 是否开启推流组件的调试
        playerDebug: false, // 是否开启视频播放组件的调试
        SDKInitStatus: false, //SDK初始化状态
        SDKLoginStatus: 0, //SDK登录状态, 0未登录 1登录中 2已登录
        userInfo: {}, // 用户个人信息
        remoteInfo: {}, // 对方信息
        remoteID: null, // 对方信息
        serverCfg: {}, // 服务器和账号配置
        messageList: null, //IM消息列表
        callID: null, // 当前呼叫id
    },

    onLaunch: function () {
        this.checkUpdate();
        this.globalData.userInfo.loginType = wx.getStorageSync('CR_LoginType') || 1; // // 登录类型   1客户 2坐席
        this.globalData.SDKInitStatus = this.SDKinit(); //SDK初始化

        wx.getSystemInfo({
            success: res => {
                console.log('系统信息：', res);
                this.globalData.systemInfo = res;
            }
        });
    },
    onShow: function (e) {

    },
    onHide: function (e) {

    },
    //进入房间方法
    enterMeeting(callID, remoteID, meetInfo) {
        callID = callID || this.globalData.callID;
        remoteID = remoteID || this.globalData.remoteID;
        meetInfo = meetInfo || this.globalData.meetInfo;
        Tools.showLoading({
            title: '正在进入房间...',
            mask: false,
        });
        this.globalData.callID = callID;
        this.globalData.remoteID = remoteID;
        this.globalData.meetInfo = meetInfo;
        RTCSDK.EnterMeeting2(meetInfo.ID, this.globalData.userInfo.UID, this.globalData.userInfo.nickname);
    },
    // 设置默认配置信息
    initDefaultCfg() {
        // 设置服务器和账号信息
        this.globalData.serverCfg.useToken = wx.getStorageSync("CR_useToken") || false; // SDK密码
        this.globalData.serverCfg.serverAddr = wx.getStorageSync("CR_ServerAddr") || 'sdk.cloudroom.com'; // 服务器地址
        this.globalData.serverCfg.AppID = wx.getStorageSync("CR_AppID") || ''; // SDK账户,
        this.globalData.serverCfg.defaultAppID = 'demo@cloudroom.com'; // 账号为空时，将使用此账号
        this.globalData.serverCfg.AppSecret = wx.getStorageSync("CR_AppSecret") || '123456'; // SDK密码
        this.globalData.serverCfg.token = wx.getStorageSync("CR_token") || ''; // SDK密码

        // 设置用户个人信息
        this.globalData.userInfo.nickname = wx.getStorageSync("CR_Nickname") || ''; // 昵称
        this.globalData.userInfo.UID = wx.getStorageSync("CR_UID") || ''; // 用户ID
    },
    SDKinit() {
        // 设置是否上报日志/是否开启控制台打印
        RTCSDK.EnableLog2File(true, true);
        const status = RTCSDK.Init(); // 初始化sdk
        if (status == 0) {
            require('./utils/sdkCallBack'); //注册SDK回调接口
            this.initDefaultCfg(); // 设置默认的配置信息
            RTCSDK.SetServerAddr(this.globalData.serverCfg.serverAddr); // 设置服务器地址

            return true;
        } else {
            console.log('SDK初始化失败');
            return false;
        }
    },
	//更新检测
	checkUpdate(){
		const updateManager = wx.getUpdateManager()

		updateManager.onCheckForUpdate(function (res) {
			// 请求完新版本信息的回调
            console.log(`有新版本: ${res.hasUpdate}`)
		})
	
		updateManager.onUpdateReady(function () {
			wx.showModal({
				title: '更新提示',
				content: '新版本已经准备好，是否重启应用？',
				success: function (res) {
					if (res.confirm) {
						// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
						updateManager.applyUpdate()
					}
				}
			})
		})
	}
})
