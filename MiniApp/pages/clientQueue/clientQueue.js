const sdkErrDesc = require('../../utils/sdkErrDesc')
const app = getApp(); // 获取app实例
const RTCSDK = require('../../utils/RTCSDK/RTC_Miniapp_SDK.min.js'); // SDK对象
const Tools = require('../../utils/tools')
const getDesc = require('../../utils/sdkErrDesc')

Page({

    /**
     * 页面的初始数据
     */
    data: {
        nickname: '',
        queueClientPageHidden: true, // 队列界面(客户)隐藏/显示
        clientWaitingPageHidden: true, // 客户排队界面隐藏/显示

        taskQueInfo: null, //排队队列信息(包含队列ID、队列名称、队列位置、排队时间)
        queStatusTimer: null, // 队列状态定时器编号

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //获得modal组件
        this.myModal = this.selectComponent("#modal");
        Tools.showLoading({
            title: '初始化队列',
            nickname: app.globalData.userInfo.nickname,
        });
        this.initData(); // 初始化原始数据
        RTCSDK.InitQueueDat(); // 初始化队列数据
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

        //当视频面签页面回来，查询自己的状态，若未登录回首页
        if (app.globalData.SDKLoginStatus === 0) {
            const desc = `未登录`;
            console.log(desc);

            wx.redirectTo({
                url: `../login/login?Toast=${desc}`,
            })
        }
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
        RTCSDK.Logout(); // 退出系统
        app.globalData.SDKLoginStatus = 0;
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return Tools.defaultShare();
    },

    initData() {

        this.setData({
            clientWaitingPageHidden: true, // 客户排队界面隐藏
            queueClientPageHidden: false, // 队列界面(客户)隐藏/显示
        })
    },

    // 点击注销按钮
    logout(e) {
        wx.navigateBack({
            delta: 1
        })
    },

    // 客户开始排队
    startQueuing(e) {
        const queId = +e.currentTarget.dataset.queid,
            curQue = e.currentTarget.dataset.info;

        // 客户开始排队 queID ,usrExtDat ,cookie
        RTCSDK.StartQueuing(queId, '', {
            queId,
            queName: curQue.name
        });
    },
    // 客户取消排队
    clientWaitingCancel(e) {
        RTCSDK.StopQueuing(e.target.dataset.queid); // 客户停止排队
    },
    // 刷新所有队列
    refreshQue() {
        RTCSDK.InitQueueDat(); // 初始化队列数据
    },
    //渲染队列信息
    renderQueueInfo() {
        let queInfoArr = RTCSDK.GetAllQueueInfo() // 获取所有队列数据
        const queInfoObj = {};

        queInfoArr.forEach(item => {
            queInfoObj[item.queID] = {
                name: item.name,
                prio: item.prio,
                desc: item.desc,
            };
        })

        this.setData({
            queInfoObj
        }, () => {
            queInfoArr.forEach(item => {
                RTCSDK.GetQueueStatus(item.queID);
            })
        });
    },
    // 更新队列状态
    updateQueueStatus(queStatus) {
        const queID = queStatus.queID;
        const queInfo = this.data.queInfoObj[queID];

        queInfo.agentNum = queStatus.agent_num;
        queInfo.srvNum = queStatus.srv_num;
        queInfo.prepareNum = queStatus.prepare_num;
        queInfo.waitNum = queStatus.wait_num;

        const key = `queInfoObj.${queID}`;
        this.setData({
            [key]: queInfo
        });
    },
    //已经开始排队，显示排队任务
    startQueuingProcess(queId, queName, position, waitingTime = 0) {
        this.stopQueuingProcess(); //最好先清除一遍计时器
        // let waitingTime = 0;    //排队时间

        const taskQueInfo = {
            queId,
            queName,
            position
        };

        this.setData({
            taskQueInfo,
            clientWaitingPageHidden: false,
            queueClientPageHidden: true,
        });

        const waitingTimeCount = () => {
            const min = parseInt(waitingTime / 60), //排队分钟
                sec = waitingTime % 60; //排队秒数

            this.setData({
                'taskQueInfo.min': min,
                'taskQueInfo.sec': sec
            });

            waitingTime++;
        }
        waitingTimeCount();
        this.waitingTimer = setInterval(waitingTimeCount, 1000);
    },
    //更新排队进程
    updateQueuingProcess(position) {
        this.setData({
            'taskQueInfo.position': position
        })
    },
    //关闭排队任务
    stopQueuingProcess() {
        clearInterval(this.waitingTimer); //清除历史计时器
        this.waitingTimer = null;
    },
    onMessage: {
        //初始化队列的结果
        InitQueueDatRslt(sdkErr, cookie) {
            if (sdkErr !== 0) {
                const desc = `初始化队列数据失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`
                Tools.showToast(desc);
                console.log(desc);
                return;
            }
            this.renderQueueInfo(); //渲染队列到页面
            RTCSDK.GetClientStatus(); //获取客户端的排队信息
        },
        // 获取客户排队及呼叫信息(可能是掉线登录进来的，需要获取一遍自己在服务端的状态)
        GetClientStatusRslt(sdkErr, status, cookie) {
            Tools.hideLoading();
            if (sdkErr !== 0) {
                const desc = `获取客户排队信息失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
                Tools.showToast(desc);
                console.log(desc);
                return;
            }

            //如果存在callInfo对象，说明用户处于呼叫业务流程
            if (status.callInfo) {
                const {
                    callID,
                    meetInfo,
                    peerName
                } = status.callInfo;
                if (status.callInfo.callState === 1) { //客户已接受呼叫，进入掉线的房间即可
                    console.log('有未结束的呼叫');
                    app.enterMeeting(callID, peerName, meetInfo);
                } else if (status.callInfo.callState === 0) { //有呼叫进入，客户还未响应呼叫
                    // sdk接受呼叫接口
                    RTCSDK.AcceptCall(callID, meetInfo, '', {
                        callerID: peerName,
                        MeetInfoObj: meetInfo
                    });
                }
            }

            //如果存在queuingInfo对象，则客户端正在排队
            if (status.queuingInfo) {
                //已经开始排队，渲染排队任务
                const {
                    queID,
                    position,
                    queuingTime
                } = status.queuingInfo;
                const queName = this.data.queInfoObj[queID].name;
                this.startQueuingProcess(queID, queName, position, queuingTime);
            }
        },
        //获取队列状态
        GetQueueStatusRslt(sdkErr, queStatus, cookie) {
            if (sdkErr !== 0) {
                const desc = `初始化装填获取失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`
                Tools.showToast(desc);
                console.log(desc);
                return;
            }
            this.updateQueueStatus(queStatus);
        },
        //队列状态变化通知,排队的队列才能接收到通知
        QueueStatusChanged(queStatus) {
            // queStatus = {"queID":78,"agent_num":0,"srv_num":0,"wait_num":1,"prepare_num":0}
            this.updateQueueStatus(queStatus);
        },
        //客户开始排队成功的操作
        StartQueuingRslt(sdkErr, position, cookie) {
            if (sdkErr !== 0) {
                console.log(sdkErr);
                const desc = getDesc(sdkErr);
                console.crlog(`排队失败,错误码: ${sdkErr},${desc}`);
                Tools.showToast(`排队失败,错误码: ${sdkErr},${desc}`);
                return;
            }

            console.crlog('开始排队成功...');
            const queId = cookie.queId,
                queName = cookie.queName;
            this.startQueuingProcess(queId, queName, position); //已经开始排队，渲染排队任务
        },
        //客户停止排队成功的操作
        StopQueuingRslt(sdkErr, cookie) {
            if (sdkErr !== 0) {
                console.crlog('停止排队失败...');
                Tools.showToast('停止排队失败，请重试！');
                return;
            }

            console.crlog('停止排队成功...');
            this.setData({
                clientWaitingPageHidden: true,
                queueClientPageHidden: false,
                taskQueInfo: null,
            })
            this.stopQueuingProcess();
        },
        //排队信息变化通知
        QueuingInfoChanged(queuingInfo) {
            // queuingInfo = {"queID":78,"position":1,"queuingTime":2}
            this.updateQueuingProcess(queuingInfo.position);
        },
        //通知有人呼入
        NotifyCallIn(callID, MeetInfoObj, callerID, usrExtDat) {
            console.crlog('收到' + callerID + '的呼叫...' + usrExtDat);
            this.stopQueuingProcess();
            Tools.showLoading({
                title: '请稍候'
            });
            // sdk接受呼叫接口
            RTCSDK.AcceptCall(callID, MeetInfoObj, '', {
                callerID,
                MeetInfoObj
            });
        },
        //通知接受对方的呼叫成功
        AcceptCallSuccess(callID, cookie) {
            console.crlog('接受呼叫成功...')
            const MeetInfoObj = cookie.MeetInfoObj,
                remoteID = cookie.callerID;

            app.enterMeeting(callID, remoteID, MeetInfoObj);
        },
        // 通知接受对方的呼叫失败
        AcceptCallFail(callID, sdkErr, cookie) {
            const desc = `接受呼叫失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`
            console.crlog(desc);
            Tools.showToast(desc);
        },
        //呼叫被挂断
        NotifyCallHungup(callID, usrExtDat) {
            this.myModal.hideModal();
            const desc = `坐席已挂断本次通话`
            console.crlog(desc);
            Tools.showToast(desc);
        },
        EnterMeetingRslt(sdkErr, cookie) {
            if (sdkErr !== 0) {
                Tools.hideLoading(); // 隐藏加载层
                const desc = `进入房间失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
                console.crlog(desc);
                wx.showModal({
                    title: '提示',
                    content: `${desc}。是否重新进入房间？`,
                    success: res => {
                        if (res.confirm) {
                            console.log('用户点击确定')
                            app.enterMeeting();
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                            RTCSDK.HungupCall(app.globalData.callID);
                            this.setData({
                                clientWaitingPageHidden: true,
                                queueClientPageHidden: false,
                                taskQueInfo: null,
                            })
                        }
                    }
                })
                return;
            }
            wx.navigateTo({
                url: '../videoCall/videoCall',
                success: () => {
                    Tools.hideLoading(); // 隐藏加载层
                    this.initData();
                }
            }); // 跳转到视频聊天页面
        },
        LineOff(sdkErr) {
            //被踢下线
            const desc = `您已掉线！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
            console.crlog(desc);
            // Tools.showToast(desc)
            wx.reLaunch({
                url: `../login/login?Toast=${desc}`,
            })
        }
    },
})
