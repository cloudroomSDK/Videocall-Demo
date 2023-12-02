const RTCSDK = require('./RTCSDK/RTC_Miniapp_SDK.min.js');
const Tools = require('./tools');
const sdkErrDesc = require('./sdkErrDesc');

//批量注册所有页面的方法
const allPagesNotifyArr = [
    'MeetingStopped', //通知房间已结束
    'StopMeetingRslt', //结束房间的结果
    'SendIMMsgRslt', //通知发送IM消息的结果
    'UserEnterMeeting', //通知用户进入了房间
    'UserLeftMeeting', //通知用户离开了房间
    'VideoStatusChanged', //通知摄像头状态变化
    'AudioStatusChanged', //通知麦克风状态变化
	'CreateCloudMixerFailed', //创建云端录制失败的通知
	'CloudMixerStateChanged',  //云端录制状态变化
	'CloudMixerOutputInfoChanged',  //云端录制文件更新通知
    'MeetingDropped',   //房间掉线通知
];

//批量注册只给当前页面的方法
const singlePageNotifyArr = [
    'EnterMeetingRslt', //进入房间的结果
    'CreateMeetingSuccess', //创建房间成功
    'CreateMeetingFail', //创建房间失败
    'OpenMicFailRslt', //打开麦克风失败
    'OpenVideoFailRslt', //打开摄像头失败
    'InitQueueDatRslt', //队列初始化的结果
    'GetClientStatusRslt', //获取客户排队、呼叫状态的结果
    'GetServingStatusRslt', //获取坐席服务队列、呼叫状态的结果
    'GetQueueStatusRslt', //获取队列状态的结果
    'StartQueuingRslt', //开始排队的结果
    'StopQueuingRslt', //停止排队的结果
    'QueuingInfoChanged', //通知排队信息变化
    'QueueStatusChanged', //通知队列状态变化
    'NotifyCallIn', //通知有呼叫
    'AcceptCallSuccess', //通知接受呼叫成功
    'AcceptCallFail', //通知接受呼叫失败
    'StartServiceRslt', //开始服务队列的结果
    'StopServiceRslt', //停止服务队列的结果
    'AutoAssignUser', //通知自动分配客户
    'ReqAssignUserRslt', //手动分配客户的结果
    'CallSuccess', //通知呼叫成功
    'CallFail', //通知呼叫失败
    'NotifyCallAccepted', //通知呼叫被接受
    'NotifyCallRejected', //通知呼叫被拒绝
    'SetDNDStatusSuccess', //设置免打扰成功通知
    'SetDNDStatusFail', //设置免打扰失败通知
    'CancelAssignUser', //系统取消了本次呼叫
    'NotifyCallHungup', //通知呼叫被挂断
    'GetMediaInfoRslt', //获取媒体共享状态的结果
    'NotifyMediaStart', //通知某人开启了影音共享
    'NotifyMediaPause', //通知继续/暂停了影音共享
    'NotifyMediaStop', //通知停止了影音共享
    'NotifyScreenShareStarted', //通知某人开启了屏幕共享
    'NotifyScreenShareStopped', //通知停止了屏幕共享
];

//注册SDK回调函数
allPagesNotifyArr.forEach(item => {
    RTCSDK[item].callback = (...arg) => {
        console.log(item, arg);
        Tools.sendAllPagesMessage(item, arg);
    }
});

//注册SDK回调函数
singlePageNotifyArr.forEach(item => {
    RTCSDK[item].callback = (...arg) => {
        console.log(item, arg);
        Tools.sendPageMessage(item, arg);
    }
});

//登录成功
RTCSDK.LoginSuccess.callback = (UID, data) => {
    console.log('LoginSuccess', [UID, data]);
    const app = getApp();
    Tools.showToast(`登录成功`, 1000);
    app.globalData.userInfo.UID = UID;
    app.globalData.SDKLoginStatus = 2;
    Tools.sendPageMessage('LoginSuccess', [UID, data]);

    wx.setStorage({
        key: 'CR_Nickname',
        data: app.globalData.userInfo.nickname,
    });
    wx.setStorage({
        key: 'CR_UID',
        data: app.globalData.userInfo.UID,
    });
}

//登录失败
RTCSDK.LoginFail.callback = (sdkErr, cookie) => {
    console.log('LoginFail', [sdkErr, cookie]);
    const app = getApp();
    const desc = `登录失败,错误码：${sdkErr},${sdkErrDesc(sdkErr)}`
    app.globalData.SDKLoginStatus = 0;
    Tools.showToast(desc);
    Tools.sendPageMessage('LoginFail', [sdkErr, cookie]);
}

//登录掉线
RTCSDK.LineOff.callback = (sdkErr) => {
    const app = getApp();
    app.globalData.SDKLoginStatus = 0;
    console.log('LineOff', [sdkErr]);
    Tools.sendPageMessage('LineOff', [sdkErr]);
}

//token即将失效通知
RTCSDK.NotifyTokenWillExpire.callback = () => {
    console.log('token即将失效');
    Tools.showToast('token即将失效', 3000);
}

//收到透明通道消息
RTCSDK.NotifyCmdData.callback = (UID, data) => {
    Tools.showToast(`收到来着${UID}的消息: ${data}`);
}

//收到大块数据消息
RTCSDK.NotifyBufferData.callback = (UID, data) => {
    Tools.showToast(`收到大数据块消息，来自${UID}的消息，消息长度: ${data.length}`);
}

