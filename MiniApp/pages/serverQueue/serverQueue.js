const sdkErrDesc = require('../../utils/sdkErrDesc')
const app = getApp(); // 获取app实例
const RTCSDK = require('../../utils/RTCSDK/RTC_Miniapp_SDK.min.js');
const Tools = require('../../utils/tools')

Page({
    /**
     * 页面的初始数据
     */
    data: {
        nickname: null,
        isAutoAssign: false, // 坐席是否开启自动分配客户
        queueInfo: [], // 全部队列的信息
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //获得modal组件
        this.myModal = this.selectComponent("#modal");
        Tools.showLoading({
            title: '初始化队列',
        });
        this.tapAutoAssign(); //手动关闭免打扰
        this.setData({
            nickname: app.globalData.userInfo.nickname
        });
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
            });
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
        app.globalData.SDKLoginStatus = 0;
        RTCSDK.Logout(); // 退出系统
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

    // 点击注销按钮
    logout(e) {
        //页面跳转成功会进入onUnload里面，所以此处不用注销登录
        wx.navigateBack({
            delta: 1
        })
    },

    // 坐席开始/停止队列服务
    startService(e) {
        const queinfo = e.currentTarget.dataset.queinfo;
        const cookie = {
            queID: queinfo.queID,
        }
        //开始服务或停止服务
        queinfo.isSvring ? RTCSDK.StopService(queinfo.queID, cookie) : RTCSDK.StartService(queinfo.queID, undefined, cookie);
    },
    // 开关自动分配
    tapAutoAssign() {
        const cookie = this.data.isAutoAssign;
        RTCSDK.SetDNDStatus(this.data.isAutoAssign ? 1 : 0, cookie); // sdk 自动分配接口 0 自动分配 1 不自动分配
    },
    // 坐席点击下一个客户
    nextClient(e) {
        this.data.isAutoAssign ? Tools.showToast('请先取消自动分配！') : RTCSDK.ReqAssignUser();
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
                desc: item.desc
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

        queInfo.queID = queID;
        queInfo.agentNum = queStatus.agent_num;
        queInfo.srvNum = queStatus.srv_num;
        queInfo.prepareNum = queStatus.prepare_num;
        queInfo.waitNum = queStatus.wait_num;

        const key = `queInfoObj.${queID}`;
        this.setData({
            [key]: queInfo
        });
    },
    //收到用户分配通知，弹出模态框
    showModal(queUser) {
        this.myModal.showModal({
            type: 'toast',
            title: '提示',
            content: '系统为您分配：' + queUser.name,
            confirm() {
                console.log('确定服务此客户...');
                RTCSDK.CreateMeeting({
                    queUser
                }); // sdk创建房间接口，

                Tools.showLoading({
                    title: '正在创建房间...'
                });
            },
            cancel() {
                console.log('取消服务此客户...');
                RTCSDK.RejectAssignUser(queUser.queID, queUser.usrID);
            }
        })
    },
    //点击了呼叫按钮
    popupCallInput() {
        if (this.data.isAutoAssign) {
            return Tools.showToast('请先关闭自动分配');
        }
        this.myModal.showModal({
            type: 'input',
            placeholder: '请输入对方ID',
            confirm(userId) {
                if (!userId) return Tools.showToast('请输入昵称');
                Tools.showLoading('请稍后');
                // sdk创建房间接口
                RTCSDK.CreateMeeting({
                    type: 'call',
                    userId
                });
            },
            cancel() {

            }
        })
    },
    onMessage: {
        //初始化队列的结果
        InitQueueDatRslt(sdkErr, cookie) {
            if (sdkErr !== 0) {
                const desc = `初始化队列数据失败。code: ${sdkErr},${sdkErrDesc(sdkErr)}`
                Tools.showToast(desc);
                console.log(desc);
                return;
            }
            this.renderQueueInfo(); //渲染队列到页面
            RTCSDK.GetServingStatus(); //获取坐席服务状态
        },
        //获取队列状态
        GetQueueStatusRslt(sdkErr, queStatus, cookie) {
            if (sdkErr !== 0) {
                const desc = `初始化装填获取失败。code: ${sdkErr},${sdkErrDesc(sdkErr)}`
                Tools.showToast(desc);
                console.log(desc);
                return;
            }
            this.updateQueueStatus(queStatus);
        },
        //队列状态变化通知,服务的队列才能接收到通知
        QueueStatusChanged(queStatus) {
            // queStatus = {"queID":78,"agent_num":0,"srv_num":0,"wait_num":1,"prepare_num":0}
            this.updateQueueStatus(queStatus);
        },
        // 获取坐席服务状态及呼叫信息的结果(可能是掉线登录进来的，需要获取一遍自己在服务端的状态)
        GetServingStatusRslt(sdkErr, status, cookie) {
            Tools.hideLoading();
            if (sdkErr !== 0) {
                const desc = `获取坐席服务状态及呼叫信息！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
                Tools.showToast(desc);
                console.log(desc);
                return;
            }

            //将未服务的队列渲染成服务状态
            const queInfoObj = this.data.queInfoObj;
            for (const key in queInfoObj) {
                const str = `queInfoObj.${key}.isSvring`;
                this.setData({
                    [str]: status.queIDs.includes(+key) ? true : false
                })
            }

            //如果存在callInfo对象，说明当前正在房间状态
            if (status.callInfo) {
                app.enterMeeting(status.callInfo.callID, status.callInfo.peerName, status.callInfo.meetInfo);
            }
        },
        //收到直呼消息
        NotifyCallIn(callID, MeetInfoObj, callerID, usrExtDat) {
            const desc = `收到来自${callerID}的呼叫消息，是否接入`;
            console.log(desc);
            this.myModal.showModal({
                type: 'toast',
                title: '提示',
                content: desc,
                confirm: () => { //用箭头函数防止this改变
                    Tools.showLoading({
                        title: '请稍候'
                    });
                    RTCSDK.AcceptCall(callID, MeetInfoObj, '', {
                        callerID,
                        MeetInfoObj
                    });
                },
                cancel() {
                    RTCSDK.RejectCall(callID);
                }
            })
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
        //开始服务队列的结果
        StartServiceRslt(sdkErr, cookie) {
            if (sdkErr !== 0) {
                const desc = `开始服务队列失败。code: ${sdkErr},${sdkErrDesc(sdkErr)}`
                Tools.showToast(desc);
                console.log(desc);
                return;
            }
            const queID = cookie.queID;
            console.log(`开始服务队列，队列ID${queID}`);
            const key = `queInfoObj.${queID}.isSvring`;
            this.setData({
                [key]: 1
            });
        },
        //停止服务队列的结果
        StopServiceRslt(sdkErr, cookie) {
            if (sdkErr !== 0) {
                const desc = `停止服务队列失败。code: ${sdkErr},${sdkErrDesc(sdkErr)}`
                Tools.showToast(desc);
                console.log(desc);
                return;
            }
            const queID = cookie.queID;
            console.log(`停止服务队列，队列ID${queID}`);
            const key = `queInfoObj.${queID}.isSvring`;
            this.setData({
                [key]: 0
            });
        },
        //自动分配用户通知
        AutoAssignUser(queUser) {
            console.log('系统自动分配客户... ');
            this.showModal(queUser);
        },
        //请求分配用户结果
        ReqAssignUserRslt(sdkErr, queUser, cookie) {
            if (sdkErr !== 0) {
                const desc = `分配用户失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
                console.log(desc);
                Tools.showToast(desc);
                return;
            }

            console.log('请求分配客户成功... ');
            this.showModal(queUser);
        },
        //创建房间成功的回调
        CreateMeetingSuccess(MeetInfoObj, cookie) {
            console.log('创建房间成功... 房间号：' + MeetInfoObj.ID);

            // 设置房间信息
            app.globalData.MeetInfoObj = MeetInfoObj // 当前房间信息

            Tools.showLoading({
                title: '正在呼叫...',
                mask: false,
            });


            // 判断是不是直接呼叫进入的房间
            if (cookie.type == 'call') {
                this.remoteID = cookie.userId;
                RTCSDK.Call(this.remoteID, MeetInfoObj); // 呼叫对方

                return;
            }
            const queUser = cookie.queUser;
            RTCSDK.AcceptAssignUser(queUser.queID, queUser.usrID); // 接受系统分配
            this.remoteID = queUser.usrID; //本次呼叫的对方ID
            RTCSDK.Call(queUser.usrID, MeetInfoObj); // 呼叫对方
        },
        //创建房间失败的回调
        CreateMeetingFail(sdkErr, cookie) {
            Tools.hideLoading(); // 隐藏loading
            const desc = `创建房间失败，已拒绝客户分配！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
            console.log(desc);
            Tools.showToast(desc);

            const queUser = cookie.queUser;
            RTCSDK.RejectAssignUser(queUser.queID, queUser.usrID);
        },
        //发起呼叫操作成功
        CallSuccess(callID, cookie) {
            console.log('发起呼叫成功');
        },
        //发起呼叫操作失败
        CallFail(callID, sdkErr, cookie) {
            Tools.hideLoading(); // 隐藏loading
            const desc = `呼叫失败! 错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
            console.log(desc);
            Tools.showToast(desc);
        },
        //通知呼叫被对方接受
        NotifyCallAccepted(callID, MeetInfoObj, usrExtDat) {
            console.log('呼叫被接受... ');

            app.enterMeeting(callID, this.remoteID, MeetInfoObj);
        },
        //通知呼叫被对方拒绝
        NotifyCallRejected(callID, sdkErr, usrExtDat) {
            const desc = `呼叫被拒绝!错误码： ${sdkErr},${sdkErrDesc(sdkErr)}`
            console.log(desc);
            Tools.hideLoading(); // 隐藏加载层
            Tools.showToast(desc)
        },
        //呼叫被挂断
        NotifyCallHungup(callID, usrExtDat) {
            this.myModal.hideModal();
            const desc = `客户已挂断本次通话`
            console.log(desc);
            Tools.showToast(desc);
        },
        //进入房间结果
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
                        }
                    }
                })
                return;
            }
            console.log('进入房间成功... ');
            wx.navigateTo({
                url: '../videoCall/videoCall',
                success: () => {
                    Tools.hideLoading(); // 隐藏加载层
                }
            }); // 跳转到视频聊天页面
        },
        //设置免打扰状态操作成功响应
        SetDNDStatusSuccess(cookie) {
            this.setData({
                isAutoAssign: !cookie
            });
            console.log('设置免打扰状态成功');
        },
        //设置免打扰状态操作失败响应
        SetDNDStatusFail(sdkErr, cookie) {
            const desc = `设置免打扰状态失败！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
            Tools.showToast(desc)
            console.log(desc);
        },
        //系统取消之前分配的的客户,用户主动取消或者坐席30秒未响应客户请求将收到此通知
        CancelAssignUser(queID, UID) {
            console.log('系统取消了本次分配的客户');
            this.myModal.hideModal();
        },
        LineOff(sdkErr) {
            //被踢下线
            const desc = `您已掉线！错误码: ${sdkErr},${sdkErrDesc(sdkErr)}`;
            console.log(desc);
            // Tools.showToast(desc)
            wx.reLaunch({
                url: `../login/login?Toast=${desc}`,
            })
        }
    },
})
