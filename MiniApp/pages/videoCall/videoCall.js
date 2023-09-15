const app = getApp();
const RTCSDK = require('../../utils/RTCSDK/RTC_Miniapp_SDK.min.js');
const Tools = require('../../utils/tools')
const sdkErrDesc = require('../../utils/sdkErrDesc')

const definition = [
    [100, 500],  //流畅
    [500, 800],  //标清
    [800, 1500]   //高清
]

const initData = (that) => {

    if (!!that.data.meetingTimer.timer) clearInterval(that.data.meetingTimer.timer);


    //推流组件默认配置,通过修改data，组件实施更新
    const RTCVideoPusher = {
        orientation: 'vertical', // vertical，horizontal,
        aspect: '3:4', // 宽高比，可选值有 3:4, 9:16
        beauty: 5, // 美颜，取值范围 0-9 ，0 表示关闭
        whiteness: 5, // 美白，取值范围 0-9 ，0 表示关闭
        devicePosition: 'front', // 前置或后置，值为front, back,此属性不支持动态修改，如需切换摄像头请调用api
        muted: false, //默认静音
        enableCamera: true, //默认打开摄像头
        localMirror: 'disable', //默认打开摄像头
        remoteMirror: false, //默认打开摄像头
        minBitrate: definition[that.data.definitionState][0], //最小码率
        maxBitrate: definition[that.data.definitionState][1], // 最大码率
        waitingImage: '/image/be_closed.jpg', // 进入后台时推流的等待画面
    }

    //视频播放组件默认配置,通过修改data，组件实施更新
    const RTCVideoPlayer = {
        orientation: 'vertical', // 画面方向，可选值有 vertical，horizontal
        objectFit: 'fillCrop', // 填充模式，可选值有 contain，fillCrop
    }

    //音频播放组件默认配置,通过修改data，组件实施更新
    const RTCAudioPlayer = {
        soundMode: 'speaker', // 声音输出方式，有效值为 speaker（扬声器）、ear（听筒）
    }

    that.setData({
        RTCVideoPusher,
        RTCVideoPlayer,
        RTCAudioPlayer,

        meetInfo: app.globalData.meetInfo,
        loginType: app.globalData.userInfo.loginType,

        isBeautify: true, // 是否开启美颜功能
    })
}


Page({
    data: {
        meetingTimer: {
            hour: 0,
            min: 0,
            sec: 0,
        },

        photoSrc: null,
        definitionState: 1,  //清晰度
        isRecording: 0, // 云端录制状态，0未启动，1启动中，2正在录制
        myCamStatus: true, //摄像头状态
        myMicStatus: true, //麦克风状态
        isMirror: false, //是否镜像
        showMenu: false,    //显示菜单
        isMySmallVideo: true,   //我的视频是小窗口
        smallVideoLeft: Math.ceil(app.globalData.systemInfo.windowWidth * (750 / app.globalData.systemInfo.windowWidth) - 225 - 20), //小窗口左距离
        smallVideoTop: Math.ceil(app.globalData.systemInfo.windowHeight * (750 / app.globalData.systemInfo.windowWidth) - 400 - 20), //小窗口上距离
    },
    // 生命周期函数--监听页面加载
    onLoad() {
        this.myModal = this.selectComponent("#modal");
        this.setData({
            remoteUserInfo: null,
            myUserInfo: null,
        })
        initData(this);
        this.initiativeLeft = true; //呼叫是否主动挂断，如果接收到呼叫被挂断将值改为false
        this.callID = app.globalData.callID; //本次呼叫ID，主动挂断呼叫时需带上
        this.remoteID = app.globalData.remoteID; //对方的UID
        this.myUID = app.globalData.userInfo.UID;
        this.videoMoveDebounce = Tools.debouncePro(this.videoMoveFN, 50);
    },
    // 生命周期函数--监听页面初次渲染完成
    onReady(res) {
        this.enterMeetingHandler(); // 自己进入房间的处理
        this.getMediaStatue(); //查询影音共享状态
        this.setKeepScreenOn(); //设置屏幕常亮
        this.updateCloudMixerState();   //更新远端录制状态
    },
    // 生命周期函数--监听页面卸载
    onUnload() {
        clearTimeout(this.keepScreenTimerId);
        if (this.data.loginType === 2 && this.data.isRecording != 0) RTCSDK.StopSvrMixer(); //坐席应该停止录制
        this.initiativeLeft && RTCSDK.HungupCall(this.callID); // 如果是按返回键离开的页面，应该挂断当前呼叫
        RTCSDK.ExitMeeting(); // sdk离开房间接口
    },
    // 用户点击右上角分享
    onShareAppMessage: function () {
        return Tools.defaultShare();
    },

    /* *************** 房间相关 *************** */
    // 本人进入房间
    enterMeetingHandler() {
        console.log('进入房间成功...');

        let time = 0,
            sec = 0,
            min = 0,
            hour = 0;
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            time++;
            sec = time % 60;
            min = parseInt((time / 60) % 60);
            hour = parseInt(time / 3600);
            this.setData({ // 设置会话持续时间
                meetingTimer: {
                    hour: hour,
                    min: min,
                    sec: sec,
                }
            })
        }, 1000);
        const myUserInfo = RTCSDK.GetMemberInfo(app.globalData.userInfo.UID);

        //用为两端是同时入会的，可能查找不到用户信息，返回undefined，请在UserEnterMeeting回调中监听用户入会回调
        const remoteUserInfo = RTCSDK.GetMemberInfo(this.remoteID);
        this.setData({
            myUserInfo,
            remoteUserInfo,
        });
        
        if(remoteUserInfo){
            this.setData({ 'RTCVideoPlayer.userId': remoteUserInfo.userID })
        }
    },

    // 点击挂断按钮
    closeCall() {
        //回到队列页面，跳转页面将进入onUnload函数
        wx.navigateBack({ delta: 1 });
    },
    // 离开房间的操作
    exitMeetFun() {
        // 挂断呼叫之后，或者呼叫被挂断之后，需要离开房间
        clearInterval(this.timer);
        if (this.data.isRecording) {
            this.startRecord(); // 关闭录制
        }
        initData(this);
        setTimeout(() => {
            this.setData({
                meetingTimer: null,
            })
        }, 500)
        RTCSDK.ExitMeeting(); // sdk离开房间接口
    },
    meetingTap() {
        let showMenu = this.data.showMenu;
        if (!showMenu) {
            this.toolbarTap();
        }
        this.setData({ showMenu: !showMenu })
    },
    //点击了视频
    videoTap(e) {
        const { removable } = e.currentTarget.dataset
        if (this.data.mediaLayout || !removable) {
            this.meetingTap();
            return;
        }

        this.setData({ isMySmallVideo: !this.data.isMySmallVideo })

    },
    toolbarTap() {
        clearTimeout(this.menuTimerId);
        this.menuTimerId = setTimeout(() => {
            this.setData({ showMenu: false })
        }, 8000);
    },
    //长按全屏
	longpressScreen(e){
		const { key } = e.currentTarget.dataset;
		if(this.fullSceenId && this.selectComponent(`#${this.fullSceenId}`)) {
			this.selectComponent(`#${key}`).exitFullScreen();
			this.fullSceenId = null;
		} else {
			this.selectComponent(`#${key}`).fullScreen(90);
			this.fullSceenId = key;
		}
	},
    //截图
    snapshot() {
        this.selectComponent('#videopusher').snapshot('raw').then(res => {
            const { height, width, tempImagePath } = res;
            this.setData({ photoSrc: tempImagePath })
        })
    },
    closePhoto() {
        this.setData({ photoSrc: null })
    },
    savaPhoto() {
        wx.saveImageToPhotosAlbum({
            filePath: this.data.photoSrc,
            success(res) {

            }
        })
    },
    // ----------------- 摄像头操作 ------------------
    // 开关摄像头
    tapSwitchCam(e) {
        const statue = e.currentTarget.dataset.status;

        statue ? RTCSDK.OpenVideo(this.myUID) : RTCSDK.CloseVideo(this.myUID);
        this.setData({
            myCamStatus: statue
        });
    },
    // 切换前后摄像头
    tapToggleCam(e) {
        RTCSDK.SetDefaultVideo(this.myUID, ''); // 切换前后摄像头
    },
    // 开关麦克风
    tapSwitchMic(e) {
        const statue = e.currentTarget.dataset.status;

        statue ? RTCSDK.OpenMic(this.myUID) : RTCSDK.CloseMic(this.myUID);
        this.setData({
            myMicStatus: statue
        });

    },
    // 开关美颜功能
    toggleBeautify(e) {
        if (this.data.isBeautify) { // 关闭美颜
            console.log('[VideoCall] 关闭美颜...');
            this.setData({
                'RTCVideoPusher.beauty': 0,
                'RTCVideoPusher.whiteness': 0,
                isBeautify: false,
            })
        } else { // 打开美颜
            console.log('[VideoCall] 打开美颜...');
            this.setData({
                'RTCVideoPusher.beauty': 5,
                'RTCVideoPusher.whiteness': 5,
                isBeautify: true,
            })
        }
    },
    //切换音频输出方式
    toggleSoundMode() {
        this.setData({
            'RTCAudioPlayer.soundMode': this.data.RTCAudioPlayer.soundMode === 'speaker' ? 'ear' : 'speaker'
        });
    },
    //切换清晰度
    toggleDefinition(e) {
        console.log(e.currentTarget.dataset.curstatue);
        let curstatue = ++e.currentTarget.dataset.curstatue;
        if (curstatue >= definition.length) {
            curstatue = 0;
        }
        this.setData({
            definitionState: curstatue,
            'RTCVideoPusher.minBitrate': definition[curstatue][0],
            'RTCVideoPusher.maxBitrate': definition[curstatue][1],
        })
    },
    //切换镜像
    toggleMirror(e) {
        const mirrorStatus = !e.currentTarget.dataset.curmirrorstatus;
        this.setData({
            'RTCVideoPusher.localMirror': mirrorStatus ? 'enable' : 'disable',
            'RTCVideoPusher.remoteMirror': mirrorStatus,
            isMirror: mirrorStatus
        })
        console.log(mirrorStatus);
    },

    videoTouchStart(e) {
        if (!e.currentTarget.dataset.removable) return;
        this.videoTouch = this.videoTouch || {};
        const touches = e.changedTouches[0];
        const obj = {
            startX: touches.pageX,
            startY: touches.pageY,
            identifier: touches.identifier,
        }
        this.lastTouch = obj;
    },
    videoTouchMove(e) {
        if (!e.currentTarget.dataset.removable) return;
        const lastTouches = this.lastTouch;
        if (lastTouches) {
            const touches = e.changedTouches[0];
            if (touches.identifier !== lastTouches.identifier) return;
            this.videoMoveDebounce(touches, lastTouches);
        }
    },
    videoMoveFN(touches, lastTouches) {
        let smallVideoLeft = this.data.smallVideoLeft + this.pxToRpx(touches.pageX - lastTouches.startX);
        let smallVideoTop = this.data.smallVideoTop + this.pxToRpx(touches.pageY - lastTouches.startY);
        const windowWidth = this.pxToRpx(app.globalData.systemInfo.windowWidth) - 225;
        const windowHeight = this.pxToRpx(app.globalData.systemInfo.windowHeight) - 400;

        smallVideoLeft = smallVideoLeft < 0 ? 0 : (smallVideoLeft > windowWidth ? windowWidth : smallVideoLeft);
        smallVideoTop = smallVideoTop < 0 ? 0 : (smallVideoTop > windowHeight ? windowHeight : smallVideoTop);

        this.setData({
            smallVideoLeft,
            smallVideoTop,
        })

        lastTouches.startX = touches.pageX;
        lastTouches.startY = touches.pageY;
    },
    videoTouchEnd(e) {
        if (!e.currentTarget.dataset.removable) return;
        const lastTouches = this.lastTouch;
        if (lastTouches) {
            const touches = e.changedTouches[0];
            if (touches.identifier !== lastTouches.identifier) return;
            this.lastTouch = null;
        }
    },
    //将px转成rpx
    pxToRpx(num) {
        return num * (750 / app.globalData.systemInfo.windowWidth);
    },
    // ----------------------- 云端录制相关 --------------------------
    // 开关云端录制
    startRecord(e) {
        //非坐席禁止点击
        if (this.data.loginType !== 2) {
            Tools.showToast('您没有权限!');
            return;
        }

        if (this.data.isRecording === 0) {
            const date = new Date();
            let year = date.getFullYear(),
                month = date.getMonth() + 1,
                day = date.getDate(),
                hour = date.getHours(),
                minute = date.getMinutes(),
                second = date.getSeconds();

            month = month < 10 ? ('0' + month) : month,
                day = day < 10 ? ('0' + day) : day,
                hour = hour < 10 ? ('0' + hour) : hour,
                minute = minute < 10 ? ('0' + minute) : minute,
                second = second < 10 ? ('0' + second) : second;

            const svrPathName = `/${year}-${month}-${day}/${year}-${month}-${day}_${hour}-${minute}-${second}_wx_${app.globalData.meetInfo.ID}.mp4`;

            const [W, H] = [1280, 720];

            const mixerCfg = {
                mode: 0,
                videoFileCfg: {
                    svrPathName,
                    vWidth: W,
                    vHeight: H,
                    layoutConfig: this.createRecordLayout()
                }
            }

            this.myMixerId = RTCSDK.CreateCloudMixer(mixerCfg);
            this.setData({ isRecording: 1 })
        } else {
            RTCSDK.DestroyCloudMixer(this.myMixerId);
            this.setData({ isRecording: 0 })
        }
    },
    // 创建云端录制内容
    createRecordLayout() {
        const [W, H] = [1280, 720];
        var layout = [];
        if (this.remoteID !== undefined) {
            //添加对端视频画面
            layout.push({
                type: 0, // 录视频
                left: 0,
                top: 0,
                width: W / 2,
                height: H,
                param: {
                    //userId.-1     -1代表录制默认摄像头，0代表录制灰色画面
                    camid: this.remoteID + "." + (RTCSDK.GetMemberInfo(this.remoteID).videoStatus === 3 ? -1 : 0)
                },
                keepAspectRatio: 1
            });

            //添加对端的昵称
            layout.push({
                type: 10,
                left: 30,
                top: 30,
                param: {
                    color: "e21918",
                    "font-size": 14,
                    text: this.remoteID
                }
            });
        }

        if (this.myUID !== undefined) {
            //添加自己的视频
            layout.push({
                type: 0, // 录制视频
                left: W / 2,
                top: 0,
                width: W / 2,
                height: H,
                param: {
                    //userId.-1     -1代表录制默认摄像头，0代表录制灰色画面
                    camid: this.myUID + "." + (RTCSDK.GetMemberInfo(this.myUID).videoStatus === 3 ? -1 : 0)
                },
                keepAspectRatio: 1,
            });


            //添加自己的昵称
            layout.push({
                type: 10, //添加文本
                left: W / 2 + 30,
                top: 30,
                param: {
                    color: "e21918",
                    "font-size": 14,
                    text: this.myUID
                }
            });
        }


        //录制时间
        layout.push({
            type: 10, // 加时间戳
            left: W - 250,
            top: H - 30,
            keepAspectRatio: 1,
            param: {
                "font-size": 14,
                text: "%timestamp%"
            }
        });

        return layout;
    },
    //更新远端录制状态
    updateCloudMixerState(){
        RTCSDK.GetAllCloudMixerInfo().some(item=> {
            if(item.owner === this.myUID) {
                this.myMixerId = item.ID;
                this.setData({ isRecording: item.state });
                return true
            }
        })
    },
    // 更新云端录制内容
    updateRecordLayout() {
		if (this.data.isRecording !== 2) return;

		const cfg = {
			videoFileCfg: {
				layoutConfig: this.createRecordLayout()
			}
		}

		RTCSDK.UpdateCloudMixerContent(this.myMixerId, cfg);
    },
    // 保持屏幕常亮
    setKeepScreenOn() {
        //因为live-player组件释放会导致屏幕常亮失效，所以需要每隔一段时间设置一次常亮。属于微信的bug
        clearTimeout(this.keepScreenTimerId);
        this.keepScreenTimerId = setTimeout(() => {
            wx.setKeepScreenOn({ // 屏幕保持常亮
                keepScreenOn: true
            });
            this.setKeepScreenOn();
        }, 14e3);
    },
    //更新屏幕共享、影音共享状态
    getMediaStatue() {
        const UID = RTCSDK.GetScreenInfo();
        UID && this.startMedia(UID, 'screen');

        RTCSDK.GetMediaInfo(); //会有回调信息
    },
    //开启影音共享或者媒体共享
    startMedia(UID, type) {
        const config = {
            type,
            userId: UID,
            // orientation: 'horizontal', // 画面方向，可选值有 vertical，horizontal
            objectFit: 'contain', // 填充模式，可选值有 contain，fillCrop
            // autoPauseIfNavigate: true, // 当跳转到其它小程序页面时，是否自动暂停本页面的实时音视频播放
            // autoPauseIfOpenNative: true, // 当跳转到其它微信原生页面时，是否自动暂停本页面的实时音视频播放
        }

        this.setData({
            mediaLayout: true,
            CRMediaPlayer: config
        });
    },
    //停止影音共享、媒体共享
    stopMedia() {
        this.setData({
            mediaLayout: false,
            CRMediaPlayer: null,
        })
    },
    // 接收SDK回调
    onMessage: {
        // 入会登录的回调，只有掉线登录才会进入此回调方法
        EnterMeetingRslt(sdkErr) {
            Tools.hideLoading();
            if (sdkErr !== 0) {
                const desc = `进入房间失败。code: ${sdkErr},${sdkErrDesc(sdkErr)}`
                console.log(desc);
                this.myModal.showModal({
                    type: 'toast',
                    title: '提示',
                    content: desc,
                    zIndex: 30,
                    confirm: () => {
                        Tools.showLoading('请稍后', false);
                        const meetingId = app.globalData.meetInfo.ID,
                            UID = app.globalData.userInfo.UID,
                            nickName = app.globalData.userInfo.nickname;

                        RTCSDK.EnterMeeting2(meetingId, UID, nickName);
                    },
                    cancel: () => {
                        this.closeCall();
                    }
                })
                return;
            }

            console.log('重新入会成功');
            this.onLoad();
            this.onReady();
        },
        UserEnterMeeting(UID) {
            console.log(`有用户进来,UID: ${UID}`);
            if (UID === this.remoteID) {
                this.setData({
                    'RTCVideoPlayer.userId': null,
                }, () => {
                    this.setData({ 'RTCVideoPlayer.userId': UID })
                })
            }
        },
        //呼叫被挂断
        NotifyCallHungup(callID, usrExtDat) {
            console.log('呼叫被挂断...');
            this.initiativeLeft = false; //呼叫被别人挂断
            this.closeCall();
        },
        // 通知用户麦克风状态变化
        AudioStatusChanged(UID, oldStatus, newStatus) {
            if (UID !== this.myUID) { // 别人的
                if (newStatus == 3) {
                    Tools.showToast(UID + '打开了麦克风');
                } else if (newStatus == 2) {
                    Tools.showToast(UID + '关闭了麦克风');
                }
                if (this.data.remoteUserInfo) this.setData({
                    'remoteUserInfo.audioStatus': newStatus
                });
            } else {
                if (this.data.myUserInfo) this.setData({
                    'myUserInfo.audioStatus': newStatus
                });
            }
        },
        //启动云端录制、云端直播失败通知
        CreateCloudMixerFailed(mixerID, sdkErr) {
            this.myMixerId = null;
            this.setData({ isRecording: 0 });
            Tools.showToast(`启动录制失败,错误码：${sdkErr},${sdkErrDesc(sdkErr)}`);
        },
        // 云端录制、云端直播状态变化通知
        CloudMixerStateChanged(mixerID, state, exParam, operUserID) {
            if (mixerID !== this.myMixerId) return;
            this.setData({ isRecording: state });
        },
        //云端录制文件、云端直播输出变化通知
        CloudMixerOutputInfoChanged(mixerID, outputInfo) {
			if (mixerID !== this.myMixerId) return;
            switch (outputInfo.state) {
                case 3:
                    Tools.showToast(`录制出错！错误码：${outputInfo.errCode},${outputInfo.errDesc}`);
                    this.myMixerId = null;
                    break;
                case 4:
                    Tools.showToast(`正在上传，${Math.ceil(outputInfo.progress)}%`);
                    break;
                case 6:
                    Tools.showToast(`上传失败`);
                    this.myMixerId = null;
                    break;
                case 7:
                    Tools.showToast(`录制已完成，可在后台中查看录像文件`);
                    this.myMixerId = null;
                    break;

                default:
                    break;
            }
        },
        // 通知用户摄像头状态变化
        VideoStatusChanged(UID, oldStatus, newStatus) {
            if (UID !== this.myUID) { // 别人的
                if (newStatus == 3) {
                    Tools.showToast(UID + '打开了摄像头');
                } else if (newStatus == 2) {
                    Tools.showToast(UID + '关闭了摄像头');
                }
                if (this.data.remoteUserInfo) this.setData({ 'remoteUserInfo.videoStatus': newStatus });
            } else {
                if (this.data.myUserInfo) this.setData({ 'myUserInfo.videoStatus': newStatus });
            }
            this.updateRecordLayout(); //更新云端录制参数
        },
        //获取影音共享的结果
        GetMediaInfoRslt(sdkErr, MediaInfoObj) {
            if (sdkErr != 0) return console.log('获取影音共享状态异常,code:' + sdkErr);
            if (MediaInfoObj.state === 2) return; //影音共享未开启
            this.startMedia(MediaInfoObj.userId, 'media');
        },
        //房间掉线
        MeetingDropped(code) {
            // 只用判断登录状态不等0的时候，如果等于0那已经进入了LineOff的回调了
            if (app.globalData.SDKLoginStatus !== 0) {
                this.myModal.showModal({
                    type: 'toast',
                    title: '提示',
                    content: '房间掉线，是否重新进入房间?',
                    zIndex: 30,
                    confirm: () => {
                        Tools.showLoading('请稍后', false);
                        const meetingId = app.globalData.meetInfo.ID,
                            UID = app.globalData.userInfo.UID,
                            nickName = app.globalData.userInfo.nickname;

                        RTCSDK.EnterMeeting2(meetingId, UID, nickName);
                    },
                    cancel: () => {
                        this.closeCall();
                    }
                })
            }
        },
        //房间外链接掉线
        LineOff(sdkErr) {
            //如果不调用退出房间用户仍然会留在房间中，但是掉线了会导致无法挂断当前呼叫、透明通道等等房间外接口无法使用
            this.myModal.hideModal()
            RTCSDK.ExitMeeting();
            this.myModal.showModal({
                type: 'toast',
                title: '提示',
                content: `您已掉线!错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`,
                showCancel: false,
                zIndex: 30,
                confirm: () => {
                    wx.reLaunch({ url: `../login/login` })
                }
            })
        },
        // 通知某人开启了影音共享
        NotifyMediaStart(UID) {
            this.startMedia(UID, 'media');
        },
        // 通知继续/暂停了影音共享
        NotifyMediaPause(UID, pause) {
            console.log(`影音播放${pause ? '暂停' : '继续'}`);
        },
        // 通知停止了影音共享
        NotifyMediaStop(UID) {
            this.stopMedia('media');
        },
        // 通知某人开启了屏幕共享
        NotifyScreenShareStarted(UID) {
            this.startMedia(UID, 'screen');
        },
        // 通知停止了屏幕共享
        NotifyScreenShareStopped(UID) {
            this.stopMedia('media');
        },
    }
})
