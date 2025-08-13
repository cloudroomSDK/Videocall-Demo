'use strict';

if (window.location.href.includes('videoCall')) {
  // 用来区分是呼叫Demo还是双录Demo，两个demo是同一套代码
  window.CRCALLDEMOTYPE = 'videoCall';
} else {
  window.CRCALLDEMOTYPE = 'record';
} // 公共模块
// window.CRCALLDEMOTYPE = 'videoCall';

((win, layui) => {
  class videoCallClass {
    constructor() {
      this.loadingIndex = null; // layui加载层索引，关闭加载层时需要
      this.allClass = {}; // 添加所有的类

      // 初始化layui模块，注册相关事件监听
      layui.use(['form', 'layer', 'laytpl'], function () {
        win.layuiForm = layui.form;
        win.layer = layui.layer;
        win.laytpl = layui.laytpl;
        videoCall.login.onLoginIdentChange(); // 注册layui登录登录身份切换事件监听
        videoCall.login.onToggleAuthType(); // 注册layui登录鉴权方式切换事件监听
        videoCall.login.onToggleAuthSwitch(); // 注册layui第三方鉴权开关事件监听
        videoCall.login.onSaveSetData(); // 注册layui表单提交事件监听
        videoCall.que.onToggleDNDSwitch(); // 注册layui免打扰开关切换事件监听
        videoCall.audioVideo.onCamChanged(); // 注册layui切换摄像头事件监听
        videoCall.audioVideo.onMicChanged(); // 注册layui切换麦克风事件监听
        videoCall.audioVideo.onSpeakerChanged(); // 注册layui切换扬声器事件监听
        videoCall.audioVideo.onVideoCfgChanged(); // 注册layui切换扬声器事件监听
      });

      // 会议中关闭页面弹出提示确认
      window.addEventListener('beforeunload', (e) => {
        window.__fib = function (n) {
          // 注册一个耗时计算
          return n < 2 ? n : __fib(n - 1) + __fib(n - 2);
        };
        if (!!videoCall.meetMgr.isMeeting) {
          // 部分浏览器支持 event.preventDefault() + return 部分浏览器支持 event.returnValue
          const event = e || window.event;
          const message = '正在通话中，仍然关闭？';

          event.preventDefault();
          if (e) {
            event.returnValue = message;
          }
          window.__recordDemoMeetID = videoCall.meetMgr.meetInfo.ID;
          return message;
        }
      });

      // 会议中确认关闭页面之后销毁会议（主要是为了结束云端录制）、退出登录
      window.addEventListener('unload', (e) => {
        if (!!videoCall.login.isLogin) {
          !!videoCall.call.callID && CRVideo_HangupCall(videoCall.call.callID, '正常挂断'); // SDK接口：挂断呼叫
          // win.CRVideo_Logout(); // SDK接口：退出登录
          if (!!videoCall.meetMgr.isMeeting) {
            win.CRVideo_ExitMeeting('refresh'); // SDK接口：退出房间
            win.CRVideo_DestroyMeeting(window.__recordDemoMeetID); // SDK接口：销毁房间
          }
          // 做一个耗时处理，防止结束会议的ajax请求发不出去
          window.__fib(40);
        }
      });

      // 监听键盘事件
      win.onkeypress = (event) => {
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if (e && e.keyCode == 13) {
          // enter 键
          this.onpressEnter();
        }
      };
    }
    // 弹出layui警告
    alertLayer(contents, yesFun) {
      this.removeLoading(); // 移除loading层
      win.layer.open({
        type: 0,
        time: 0,
        // area: 'auto',
        title: ['提示', 'font-size:14px;'],
        content: contents,
        btn: ['确定'],
        yes: function (index, layero) {
          yesFun != undefined ? yesFun() : '';
          layer.close(index);
        },
      });
    }
    // 弹出layui提示
    tipLayer(msg, timer) {
      this.removeLoading(); // 移除loading层
      if (timer == undefined) timer = 3000;
      win.layer.open({
        title: 0,
        btn: 0,
        content: msg,
        closeBtn: 0,
        shade: 0,
        time: timer,
      });
    }
    // 弹出模态框
    modalLayer(title, content, btnsObj, time) {
      let btns = btnsObj.btns,
        btn1Callback = btnsObj.btn1Callback,
        btn2Callback = btnsObj.btn2Callback;
      win.layer.open({
        closeBtn: 0,
        time: time !== undefined ? time : 0,
        title: [title, 'font-size:14px'],
        content: content,
        btn: btns,
        btn1: function (index) {
          btn1Callback();
          layer.close(index);
        },
        btn2: function (index) {
          btn2Callback();
        },
      });
    }
    // 弹出输入框
    promptLayer(formType, value, title, yesCallback) {
      win.layer.prompt(
        {
          formType: formType || 2,
          value: value || '', // 默认值
          title: title || '请输入',
          // area: ['300px', '300px'] //自定义文本域宽高
        },
        function (value, index, elem) {
          yesCallback(value);
          layer.close(index);
        }
      );
    }
    // 弹出layui加载ing
    lodingLayer(style, options) {
      this.removeLoading(); // 移除loading层
      if (!!style) {
        // style为 0 undefined null '' 等
        style = 0;
      }
      if (options == undefined) {
        options = {
          time: 15000, // 最多15秒自动关闭
        };
      }
      this.loadingIndex = win.layer.load(style, options);
    }
    // 移除layui加载
    removeLoading() {
      win.layer.close(this.loadingIndex);
    }
    // 移除弹出层
    closeLayer(type) {
      win.layer.closeAll(type == undefined ? '' : type);
    }
    // 判断是否是数组类型
    isArrayFn(value) {
      if (typeof Array.isArray === 'function') {
        return Array.isArray(value);
      } else {
        return Object.prototype.toString.call(value) === '[object Array]';
      }
    }
    // 获取当前时间
    getDate() {
      const date = new Date();
      let year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds();

      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;

      return {
        year,
        month,
        day,
        hour,
        minute,
        second,
      };
    }
    // 处理按下enter键
    onpressEnter() {
      if ($('.chat-box').css('display') === 'block') {
        $('#sendMsg').click();
      }
    }
  }
  win.videoCall = new videoCallClass();
})(window, layui); // 登录模块

((win, videoCall) => {
  class loginClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); // 注册SDK回调接口和通知接口
    }
    // 初始化数据
    initData() {
      this.storage = JSON.parse(sessionStorage.getItem('remoteRecord_pc_login')) || {}; // 存储在session的登录参数
      this.server = this.storage.server || win.location.host || ''; // 登录的服务器地址
      this.authType = this.storage.authType || parseInt($('#authType').val()); // 鉴权方式 0appID鉴权 1token鉴权
      this.appID = this.storage.appID || $('#appIDInput').val(); // 登录的账号（appID）
      this.appSecret = this.storage.appSecret || $('#appSecretInput').val(); // 登录的密码
      this.token = this.storage.token || $('#tokenInput').val(); // token鉴权方式登录的token
      this.protocol = this.storage.protocol || parseInt($('input[name="protocol"]:checked').val()); // 流媒体转发协议
      this.authSwitch = this.storage.authSwitch || !!$('#authSwitch').attr('checked'); // 是否启用第三方鉴权
      this.userAuthCode = this.storage.userAuthCode || $('#userAuthCode').val(); // 启用第三方鉴时的鉴权参数
      this.nickname = this.storage.nickname || `H5_${Math.floor(Math.random() * 8999) + 1000}`; // 登录昵称
      this.userID = this.storage.userID || `${this.nickname}`; // 登录SDK系统的用户唯一ID
      this.loginIdent = this.storage.loginIdent || 0; // 登录身份，0坐席 1客户
      this.isLogin = false; // 是否已经登录
      // 初始化显示登录页标题、昵称和身份
      this.showLoginName = () => {
        $('#nicknameInput').val(this.nickname);
        $('#loginIdent').val(this.loginIdent);
        if (window.CRCALLDEMOTYPE === 'record') {
          $('#demoTitle').html('远程双录系统');
          $('title').html('远程双录Demo');
        }
        if (window.CRCALLDEMOTYPE === 'videoCall') {
          $('#demoTitle').html('视频呼叫系统');
          $('title').html('视频呼叫Demo');
        }
      };
      this.showLoginName();
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：回调 登录成功
      win.CRVideo_LoginSuccess.callback = (...args) => {
        this.loginSuccessCallback(...args);
      };
      // SDK接口：回调 登录失败
      win.CRVideo_LoginFail.callback = (...args) => {
        this.loginFailCallback(...args);
      };
      // SDK接口：通知 Token即将失效
      win.CRVideo_NotifyTokenWillExpire.callback = () => {
        this.notifyTokenWillExpireHandler();
      };
      // SDK接口：通知 已从系统掉线
      win.CRVideo_LineOff.callback = (...args) => {
        this.lineOffHandler(...args);
      };
      // SDK接口：回调 更新Token的结果
      win.CRVideo_UpdateTokenRslt.callback = (...args) => {
        this.updateTokenCallback(...args);
      };
    }
    // 监听昵称输入
    onNicknameInput() {
      this.nickname = $('#nicknameInput').val();
      this.userID = `${this.nickname}`;
    }
    // 监听登录身份选择
    onLoginIdentChange() {
      const that = this;
      win.layuiForm.on('select(loginIdent)', function (data) {
        that.loginIdent = parseInt(data.value);
      });
    }
    // 打开设置面板
    openSetBox() {
      this.renderData({
        // 取存储的参数给表单赋值并渲染
        server: this.server,
        authType: this.authType,
        appID: this.appID,
        appSecret: this.appSecret,
        token: this.token,
        protocol: this.protocol,
        authSwitch: this.authSwitch,
        userAuthCode: this.userAuthCode,
      });
      $('#sdkVer').html(win.CRVideo_GetSDKVersion()); // 显示版本号
      $('.login-setting-box').show(); // 显示设置面板
    }
    // 重新渲染layui设置表单
    renderData(data) {
      win.layuiForm.val('settForm', data); // 给设置面板的layui表单赋值
      win.layuiForm.render(); // layui表单更新渲染
      this.toggleTokenInput(data.authType); // 显示隐藏token输入框
      this.toggleAuthCodeInput(data.authSwitch); // 显示隐藏第三方鉴权参数输入框
      return false;
    }
    // 监听layui登录鉴权方式下拉切换事件，appID鉴权或Token鉴权
    onToggleAuthType() {
      const that = this;
      win.layuiForm.on('select(authTypeSelect)', function (data) {
        that.toggleTokenInput(parseInt(data.value));
      });
    }
    // 切换显示appID输入或Token输入
    toggleTokenInput(tokenInput) {
      win.layuiForm.val('settForm', {
        authType: tokenInput,
      });
      if (tokenInput === 0) {
        $('.token-area').hide();
        $('.login-appID').show();
        $('.login-appSec').show();
      } else {
        $('.token-area').show();
        $('.login-appID').hide();
        $('.login-appSec').hide();
      }
    }
    // 监听layui第三方鉴权开关事件
    onToggleAuthSwitch() {
      const that = this;
      win.layuiForm.on('switch(authCodeSwitch)', function (data) {
        that.toggleAuthCodeInput(data.elem.checked); // 显示隐藏第三方鉴权参数输入框
      });
    }
    // 显示/隐藏第三方鉴权参数输入框
    toggleAuthCodeInput(authSwitch) {
      if (authSwitch !== undefined && authSwitch !== false) {
        $('.userAuthCode-area').show();
      } else {
        $('.userAuthCode-area').hide();
      }
    }
    // 点击设置面板确定按钮
    onSaveSetData() {
      const that = this;
      win.layuiForm.on('submit(settFormSubmit)', function (data) {
        // 监听layui确定按钮表单提交事件
        $('.login-setting-box').hide();
        console.log(data.field);
        that.saveLoginData(data.field); // 存储参数到sessionStorage
        return false;
      });
    }
    // 点击设置面板重置按钮
    resetSetForm() {
      let host = win.location.host.includes('localhost') || win.location.host.includes('127.0.0.1') || win.location.host.includes('file') || !win.location.host ? '' : win.location.host;
      this.renderData({
        // 重置layui表单并渲染
        server: host,
        authType: 0,
        appID: '默认',
        appSecret: '默认',
        token: '',
        protocol: 0,
        authSwitch: false,
        userAuthCode: '',
      });
    }
    // 存储登录参数
    saveLoginData(data) {
      if (data == undefined) data = this;
      // 存储到 login对象
      if (data.server != undefined) this.server = data.server;
      if (data.authType != undefined) this.authType = parseInt(data.authType);
      if (data.appID != undefined) this.appID = data.appID;
      if (data.appSecret != undefined) this.appSecret = data.appSecret;
      if (data.token != undefined) this.token = data.token;
      if (data.protocol != undefined) this.protocol = parseInt(data.protocol);
      this.authSwitch = !!data.authSwitch; // layui的switch关闭时，这个属性undefind，赋值为false
      if (data.userAuthCode !== undefined) this.userAuthCode = data.userAuthCode;
      if (data.nickname !== undefined) this.nickname = data.nickname;
      if (data.userID !== undefined) this.userID = data.userID;
      if (data.loginIdent !== undefined) this.loginIdent = parseInt(data.loginIdent);
      // 存储到 sessionStorage
      const sessionVal = {
        server: this.server,
        authType: this.authType,
        appID: this.appID,
        appSecret: this.appSecret,
        token: this.token,
        protocol: this.protocol,
        authSwitch: this.authSwitch,
        userAuthCode: this.userAuthCode,
        nickname: this.nickname,
        userID: this.userID,
        loginIdent: this.loginIdent,
      };
      sessionStorage.setItem('remoteRecord_pc_login', JSON.stringify(sessionVal));
    }
    // 点击登录按钮
    onClickLoginBtn() {
      const data = win.layuiForm.val('loginPageBox');
      this.saveLoginData({
        // 存储登录参数
        userID: data.loginName,
        nickname: data.loginName,
        loginIdent: parseInt(data.loginIdentify),
      });
      if (!this.nickname) {
        videoCall.tipLayer(`昵称不能为空！`);
        return;
      }
      videoCall.lodingLayer(); // 显示loading动画
      this.initSDK();
    }
    // 初始化SDK
    initSDK() {
      // SDK接口：初始化SDK
      CRVideo_Init().then(
        (res) => {
          // 初始化成功
          // SDK接口：设置sdk配置
          CRVideo_SetSDKParams({
            MSProtocol: this.protocol, // 媒体流转发协议，1 udp, 2 tcp 默认为udp
            // securityEnhancement: true, //是否开启安全增强（会有跨域问题，需配置跨域响应头）
          });
          this.setSDKServer(); // 设置服务器地址
          this.loginToServer('normally'); // 登录系统，用cookie来区分正常登录和掉线重登
        },
        (sdkErr) => {
          // 初始化失败
          console.log(sdkErr);
          let errMsg;
          switch (sdkErr) {
            case 8001:
              errMsg = '获取媒体设备权限发生未知错误';
              break;
            case 8002:
              errMsg = '获取媒体设备权限被拒绝';
              break;
            case 8003:
              errMsg = '枚举媒体设备列表失败';
              break;
            case 8004:
              errMsg = '当前浏览器不支持互动音视频';
            default:
              errMsg = '获取媒体设备权限发生未知错误';
              break;
          }
          videoCall.alertLayer(`初始化失败！${errMsg}`);
          return;
        }
      );
    }
    // 设置服务器地址
    setSDKServer() {
      win.CRVideo_SetServerAddr(this.server); // SDK接口：设置服务器地址
    }
    // 登录到系统
    loginToServer(cookie) {
      let userAuthCode = '';
      if (!!this.authSwitch) {
        userAuthCode = this.userAuthCode;
      }
      if (this.authType === 0) {
        // SDK接口：密码鉴权登录
        win.CRVideo_Login(this.appID, this.appSecret == '默认' || this.appSecret.length == 32 ? this.appSecret : md5(this.appSecret), this.nickname, this.userID, userAuthCode, cookie);
      } else {
        // SDK接口：Token鉴权登录
        win.CRVideo_LoginByToken(this.token, this.nickname, this.userID, userAuthCode, cookie);
      }
    }
    // 登录成功的回调
    loginSuccessCallback(userID, cookie) {
      console.log(`登录成功，userID:${userID}，cookie:${cookie}`);
      this.isLogin = true; // 保存登录状态为已登录
      videoCall.removeLoading();
      setTimeout(() => {
        videoCall.tipLayer('登录成功');
      }, 500);
      if (!!cookie && cookie.includes('reLogin')) {
        videoCall.que.initQueue('reLogin'); // 初始化队列
        return;
      }
      if (videoCall.login.loginIdent === 1) {
        // 客户身份
        $('.choose-btn.btn2').html('等待坐席呼叫');
      } else {
        $('.choose-btn.btn2').html('直接呼叫');
      }
      $('.call-page').show().siblings().hide(); // 显示呼叫模式选择界面
    }
    // 登录失败的回调
    loginFailCallback(sdkErr, cookie) {
      console.log(`登录失败，sdkErr:${sdkErr},cookie:${cookie}`);
      if (!!cookie && cookie.includes('reLogin')) {
        videoCall.modalLayer('失败', '登录失败，是否重试？', {
          btns: ['重试', '取消'],
          btn1Callback() {
            videoCall.login.loginToServer(`reLogin`); // 重连
          },
          btn2Callback() {
            videoCall.meetMgr.exitMeeting();
            videoCall.login.onClickLogoutBtn();
          },
        });
        return;
      }
      let errMsg;
      switch (sdkErr) {
        case 7:
          errMsg = '用户名或密码错误！';
          break;
        case 14:
          errMsg = '启用了第三方鉴权，但缺少鉴权信息！';
          break;
        case 15:
          errMsg = '没有启用第三方鉴权，请关闭第三方鉴权开关！';
          break;
        case 17:
          errMsg = '第三方鉴权失败！';
          break;
        case 18:
          errMsg = 'Token已过期！';
          break;
        case 20:
          errMsg = '鉴权appID不存在！';
          break;
        case 21:
          errMsg = 'Token鉴权失败！';
          break;
        case 22:
          errMsg = '此app非Token鉴权！';
          break;
        case 202:
          errMsg = '网络异常！';
          break;
        case 204:
          errMsg = 'socket连接失败！';
          break;
        default:
          errMsg = '未知错误！';
          break;
      }
      videoCall.alertLayer(`登录失败！${errMsg}`);
    }
    // 选择进入队列页面按钮
    onClickShowQuePageBtn() {
      videoCall.que.showQuePage(); // 显示队列页面
    }
    // 选择直接呼叫按钮
    onClickDirectCallBtn() {
      if (videoCall.login.loginIdent === 1) return;
      $('.call-box').css({
        visibility: 'visible',
        opacity: 1,
      });
    }
    // 点击直接呼叫盒子的呼叫按钮
    onClickCallBtn(btnDom) {
      console.log('呼叫');
      const userID = $('#callUserID').val();
      if (!!userID) {
        // videoCall.call.otherUserInfo.userID = userID;
        videoCall.call.beCalledInfo.userID = userID;
        videoCall.call.callerInfo.userID = videoCall.login.userID;
        videoCall.call.callerInfo.nickname = videoCall.login.nickname;
        $('.call-box').css({
          // 隐藏面板
          visibility: 'hidden',
          opacity: 0,
        });
        videoCall.call.callType = 1; // 呼叫模式，直接呼叫
        videoCall.meetMgr.createMeetingFn('直接呼叫，创建的房间'); // 创建房间并开始呼叫
      }
    }
    // 点击注销按钮
    onClickLogoutBtn() {
      $('.login-page').show().siblings().hide();
      if (this.loginIdent === 0) {
        videoCall.que.stopAllQueService(); // 如果是坐席身份，注销时停止服务所有的队列
      }
      this.logout(); // 退出登录
    }
    // SDK通知token即将失效
    notifyTokenWillExpireHandler() {
      videoCall.promptLayer(2, null, 'Token即将失效，请更新Token', function (val) {
        win.CRVideo_UpdateToken(val); // SDK接口：更新Token
      });
    }
    // 更新token的结果
    updateTokenCallback(sdkErr) {
      if (sdkErr == 0) {
        videoCall.tipLayer('Token更新成功');
      } else {
        videoCall.modalLayer('失败', `Token更新失败：${sdkErr}，是否重试？`, {
          btns: ['重试', '取消'],
          btn1Callback() {
            videoCall.promptLayer(2, null, '更新Token', function (val) {
              win.CRVideo_UpdateToken(val); // SDK接口：更新Token
            });
          },
          btn2Callback() {},
        });
      }
    }
    // SDK通知我从系统中掉线了
    lineOffHandler(sdkErr) {
      console.log(`掉线了，${sdkErr}`);
      if (!videoCall.login.isLogin) return;
      if (sdkErr == 10) {
        // 被踢下线了
        $('.login-page').show().siblings().hide();
        videoCall.alertLayer(`用户ID重复登录，您被挤下线了！`);
        if (!!videoCall.meetMgr.isMeeting) {
          videoCall.meetMgr.exitMeeting(); // 退出房间
          videoCall.meetMgr.destroyMeeting(videoCall.meetMgr.meetInfo.ID); // 销毁房间
        }
        this.logout();
      } else if (sdkErr == 204) {
        // 网络掉线
        videoCall.modalLayer('系统掉线', '您已从系统中掉线，是否重连？', {
          btns: ['重连', '取消'],
          btn1Callback() {
            videoCall.login.loginToServer(`reLogin`); // 掉线重登
          },
          btn2Callback() {
            videoCall.meetMgr.exitMeeting();
            videoCall.login.onClickLogoutBtn();
          },
        });
      } else if (sdkErr == 18) {
        $('.login-page').show().siblings().hide();
        videoCall.alertLayer(`Token失效，您已下线，请重新登录！`);
        if (!!videoCall.meetMgr.isMeeting) {
          videoCall.meetMgr.exitMeeting(); // 退出房间
          videoCall.meetMgr.destroyMeeting(videoCall.meetMgr.meetInfo.ID); // 销毁房间
        }
        this.logout();
      }
    }
    // 退出登录操作
    logout() {
      console.log('停止队列状态更新');
      clearInterval(videoCall.que.queStatusTimer); // 停止更新队列状态
      win.CRVideo_Logout(); // SDK接口：退出登录
      win.CRVideo_Uninit(); // SDK接口：反初始化
      this.isLogin = false;
      setTimeout(() => {
        videoCall.que.initData();
        videoCall.call.initData();
        videoCall.meetMgr.initData();
        videoCall.meeting.initData();
        videoCall.audioVideo.initData();
        videoCall.svrMixerMgr.initData();
        videoCall.screenShare.initData();
        videoCall.mediaShare.initData();
        videoCall.msgMgr.initData();
        videoCall.shuanglu.initData();
      }, 500);
    }
  }
  videoCall.allClass.loginClass = loginClass;
  videoCall.login = new videoCall.allClass.loginClass();
})(window, videoCall); // 队列模块

((win, videoCall) => {
  class queueClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); // 注册SDK回调接口和通知接口
      this.addSeatModulFn(); // 添加坐席相关方法
      this.addUserModulFn(); // 添加客户相关方法
    }
    // 初始化数据
    initData() {
      this.allQueList = []; // 所有队列信息的集合 [{queID,prio,name,desc,agent_num,wait_num,srv_num},...]
      this.queStatusTimer = null; // 队列状态刷新定时器
      this.queuingInfo = {}; // 客户排队信息
      this.queuingTimer = null; // 客户排队时间定时器
      this.queuingLayerIndex = null; // 客户排队弹窗
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：回调 初始化队列的结果
      win.CRVideo_InitQueueDatRslt.callback = (...args) => {
        this.initQueRsltCallback(...args);
      };
      // SDK接口：回调 获取某个队列状态的结果
      win.CRVideo_GetQueueStatusRslt.callback = (...args) => {
        this.getQueStatusRsltCallback(...args);
      };
      // SDK接口：回调 坐席开始服务队列的结果
      win.CRVideo_StartServiceRslt.callback = (...args) => {
        this.startServicesCallback(...args);
      };
      // SDK接口：回调 坐席停止服务队列的结果
      win.CRVideo_StopServiceRslt.callback = (...args) => {
        this.stopServicesCallback(...args);
      };
      // SDK接口：通知 队列状态变化
      win.CRVideo_QueueStatusChanged.callback = (...args) => {
        this.queStatusChangedHandler(...args);
      };
      // SDK接口：通知 系统自动分配客户
      win.CRVideo_AutoAssignUser.callback = (...args) => {
        this.autoAssignUserHandler(...args);
      };
      // SDK接口：通知 系统取消分配客户
      win.CRVideo_CancelAssignUser.callback = (...args) => {
        this.cancelAssignUserHandler(...args);
      };
      // SDK接口：回调 坐席响应系统分配客户的结果
      win.CRVideo_ResponseAssignUserRslt.callback = (...args) => {
        this.responseAssignUserRsltCallback(...args);
      };
      // SDK接口：回调 坐席请求系统分配一个客户
      win.CRVideo_ReqAssignUserRslt.callback = (...args) => {
        this.reqAssignUserRsltCallback(...args);
      };
      // SDK接口：回调 客户开始排队的结果
      win.CRVideo_StartQueuingRslt.callback = (...args) => {
        this.startQueuingRsltCallback(...args);
      };
      // SDK接口：回调 客户停止排队的结果
      win.CRVideo_StopQueuingRslt.callback = (...args) => {
        this.stopQueuingRsltCallback(...args);
      };
      // SDK接口：通知 客户排队信息变化
      win.CRVideo_QueuingInfoChanged.callback = (...args) => {
        this.queuingInfoChangedHandler(...args);
      };
    }
    // 显示队列页面
    showQuePage() {
      videoCall.call.callType = 2; // 呼叫模式，排队叫号
      videoCall.que.initQueue(); // 初始化队列
      // 根据不同的登录身份（坐席或客户）显示不同的队列界面
      // 如果不需要队列功能，可以不显示队列界面，直接去呼叫模块或者视频通话模块
      if (videoCall.login.loginIdent === 0) {
        $('.seat-name').html(videoCall.login.nickname);
        $('.seat-que-page').show().siblings('div').hide(); // 显示坐席身份的队列界面
      } else {
        $('.user-name').html(videoCall.login.nickname);
        $('.user-que-page').show().siblings('div').hide(); // 显示客户身份的队列界面
      }
    }
    // 初始化队列
    initQueue(cookie) {
      win.CRVideo_InitQueueDat(cookie); // SDK接口：初始化队列，将回调CRVideo_InitQueueDatRslt.callback
    }
    // 初始化队列结果的回调操作
    initQueRsltCallback(sdkErr, cookie) {
      if (sdkErr == 0) {
        console.log(`初始化队列成功`);
        const allQueList = win.CRVideo_GetAllQueueInfo(); // SDK接口：查询所有队列的信息，直接返回队列集合
        this.updateQueListData(allQueList); // 更新存储数据列表
        this.startRefreshQueStatus(1, 5000); // 开始刷新队列状态
        if (cookie == 'reLogin') {
          const sessionInfo = CRVideo_GetSessionInfo();
          if (!sessionInfo.callID) {
            // 当前会话已经不在了，就不再进房间了
            videoCall.alertLayer(`当前通话已被对方挂断`);
            videoCall.meetMgr.meetingStoppedHandler();
            return;
          } else {
            videoCall.meetMgr.enterMeetFn('reEnter'); // 当前会话还在，重新进入会话
          }
        }
      } else {
        console.log(`初始化队列失败`);
      }
    }
    // 开始监听队列状态
    startRefreshQueStatus(bool, times) {
      clearInterval(this.queStatusTimer);
      this.queStatusTimer = null;
      if (bool) {
        if (times == undefined) times = 5000;
        // SDK刷新所有的队列状态接口，将触发多次CRVideo_GetQueueStatusRslt.callback回调
        // 刷新所有队列状态性能开销较大，一般不建议调用此接口，而是单独只刷新和自己有关的队列的状态
        win.CRVideo_RefreshAllQueueStatus(); // SDK接口：刷新所有队列的状态
        this.queStatusTimer = setInterval(() => {
          win.CRVideo_RefreshAllQueueStatus(true); // SDK接口：刷新所有队列的状态
        }, times);
      }
    }
    // 通知某个队列的状态变化
    queStatusChangedHandler(queStatus) {
      this.updateQueListData(null, queStatus, null); // 更新队列数据
    }
    // 更新队列列表数据并渲染
    updateQueListData(queInfo, queStatus, serviceStatus) {
      // 更新队列信息
      if (!!queInfo) {
        const queIDArr = []; // 队列id集合，用来排序
        if (videoCall.isArrayFn(queInfo)) {
          // 更新的是queInfo集合
          queInfo.forEach((i) => {
            let isNew = true;
            this.allQueList.forEach((j) => {
              if (j.queID == i.queID) {
                isNew = false;
                j.prio = i.prio; // 优先级
                j.name = i.name; // 队列名
                j.desc = i.desc; // 队列描述
                queIDArr.push(j.queID);
              }
            });
            if (isNew) {
              i.isServing = false; // 本人是否正在服务此队列
              i.agent_num = 0; // 坐席人数
              i.wait_num = 0; // 等待人数
              i.srv_num = 0; // 服务中的会话数
              this.allQueList.push(i);
              queIDArr.push(i.queID);
            }
          });
          queIDArr.sort((a, b) => {
            // 按queID排序
            return a - b;
          });
          const newQueList = [];
          queIDArr.forEach((id) => {
            this.allQueList.forEach((item) => {
              if (item.queID == id) {
                newQueList.push(item);
              }
            });
          });
          this.allQueList = newQueList;
        } else {
          // 更新的是单个queInfo对象
          // ...
        }
      }
      // 更新队列状态
      if (!!queStatus) {
        this.allQueList.forEach((item) => {
          if (item.queID == queStatus.queID) {
            item.agent_num = queStatus.agent_num; // 坐席人数
            item.wait_num = queStatus.wait_num; // 等待人数
            item.srv_num = queStatus.srv_num; // 服务中的会话数
          }
        });
      }
      // console.log(this.allQueList);
      // 更新完数据后渲染
      if (videoCall.login.loginIdent === 0) {
        // 坐席队列
        // 更新队列服务情况
        if (!!serviceStatus) {
          const queID = serviceStatus.queID;
          const isServing = serviceStatus.isServing;
          this.allQueList.forEach((item) => {
            if (item.queID == queID) {
              item.isServing = isServing; // 本人是否正在服务此队列
            }
          });
        }
        // layui模板引擎渲染
        const getTpl = seatQueListTpl.innerHTML, // 模板
          view = document.getElementById('seatQueList'); // 视图容器
        win.laytpl(getTpl).render(this.allQueList, function (html) {
          view.innerHTML = html;
        });
      } else {
        // 客户队列
        // layui模板引擎渲染
        const getTpl = userQueListTpl.innerHTML, // 模板
          view = document.getElementById('userQueList'); // 视图容器
        win.laytpl(getTpl).render(this.allQueList, function (html) {
          view.innerHTML = html;
        });
      }
    }
    // 获取队列状态的结果回调操作
    getQueStatusRsltCallback(status, sdkErr) {
      this.updateQueListData(null, status);
    }

    // 坐席队列相关方法
    addSeatModulFn() {
      // 坐席点击开启服务按钮
      this.onClickServiceBtn = (queID, bool) => {
        this.updateQueListData(null, null, {
          queID: queID,
          isServing: bool,
        });
        if (bool) {
          win.CRVideo_StartService(queID, 0, '我是cookie，可以不传'); // SDK接口：坐席开始服务某个队列
        } else {
          win.CRVideo_StopService(queID, '我是cookie，可以不传'); // SDK接口：坐席停止服务某个队列
        }
      };
      // 坐席开始服务队列的结果的回调
      this.startServicesCallback = (queID, sdkErr, cookie) => {
        if (sdkErr == 0) {
          console.log(`开始服务队列 ${queID} 成功！`);
        } else {
          console.log(`开始服务队列 ${queID} 失败！`);
        }
      };
      // 坐席开始服务队列的结果的回调
      this.stopServicesCallback = (queID, sdkErr, cookie) => {
        if (sdkErr == 0) {
          console.log(`停止服务队列 ${queID} 成功！`);
        } else {
          console.log(`停止服务队列 ${queID} 失败！`);
        }
      };
      // 通知坐席系统自动分配了客户
      this.autoAssignUserHandler = (CRVideo_QueUser) => {
        console.log('系统分配了用户：');
        console.log(CRVideo_QueUser);
        videoCall.modalLayer(
          '客户分配中',
          `系统为您分配客户：${CRVideo_QueUser.nickname}`,
          {
            btns: ['接受', '拒绝'],
            btn1Callback() {
              win.CRVideo_AcceptAssignUser(CRVideo_QueUser.queID, CRVideo_QueUser.userID, 'accept'); // SDK接口：接受系统分配
              // videoCall.call.otherUserInfo.userID = CRVideo_QueUser.userID; // 存储对方的信息
              // videoCall.call.otherUserInfo.nickname = CRVideo_QueUser.nickname;
              videoCall.call.beCalledInfo.userID = CRVideo_QueUser.userID;
              videoCall.call.beCalledInfo.nickname = CRVideo_QueUser.nickname;
            },
            btn2Callback() {
              win.CRVideo_RejectAssignUser(CRVideo_QueUser.queID, CRVideo_QueUser.userID, 'reject'); // SDK接口：拒绝系统分配
            },
          },
          0
        );
      };
      // 通知坐席系统取消了分配客户
      this.cancelAssignUserHandler = (queID, userID) => {
        console.log('系统取消分配用户：');
        console.log(queID, userID);
        videoCall.closeLayer();
      };
      // 坐席响应系统分配的结果的回调
      this.responseAssignUserRsltCallback = (sdkErr, cookie) => {
        if (sdkErr == 0) {
          if (cookie == 'accept') {
            console.log('接受系统分配响应成功，开始创建房间');
            videoCall.meetMgr.createMeetingFn('排队呼叫，创建的房间'); // 创建房间
          } else if (cookie == 'reject') {
            console.log('拒绝系统分配响应成功');
          }
        } else {
          console.log('响应系统分配失败');
        }
      };
      // 坐席切换开启（关闭）免打扰
      this.onToggleDNDSwitch = () => {
        win.layuiForm.on('switch(isDNDSwitch)', function (data) {
          if (data.elem.checked == false) {
            videoCall.call.setDNDStatus(0); // 关闭免打扰
          } else {
            videoCall.call.setDNDStatus(1); // 开启免打扰
          }
        });
      };
      // 坐席请求分配一个客户
      this.reqAssignUser = () => {
        win.CRVideo_ReqAssignUser('我是cookie，可以不传'); // SDK接口：坐席请求分配一个客户
      };
      // 坐席请求分配一个客户的结果的回调
      this.reqAssignUserRsltCallback = (sdkErr, CRVideo_QueUser, cookie) => {
        console.log(sdkErr, CRVideo_QueUser, cookie);
        if (sdkErr == 0) {
          this.autoAssignUserHandler(CRVideo_QueUser); // 通知系统分配了客户
        } else {
          let errMsg;
          switch (sdkErr) {
            case 403:
              errMsg = `分配客户失败，请先开启队列服务！`;
              break;
            case 401:
              errMsg = `分配客户失败，当前服务的队列没有客户在排队！`;
              break;
            default:
              errMsg = `分配客户失败，未知错误！`;
              break;
          }
          videoCall.alertLayer(errMsg);
        }
      };
      // 坐席停止服务所有队列
      this.stopAllQueService = () => {
        this.allQueList.forEach((item) => {
          if (item.isServing == true) {
            this.onClickServiceBtn(item.queID, false);
          }
        });
      };
    }

    // 客户队列相关方法
    addUserModulFn() {
      // 客户点击刷新按钮
      this.onClickRefreshBtn = () => {
        win.CRVideo_RefreshAllQueueStatus(); // SDK接口：刷新所有队列的状态
      };
      // 客户点击队列开始排队
      this.onClickUserQueItem = (queID) => {
        win.CRVideo_StartQueuing(queID, '拓展数据，坐席可以收到', '我是cookie，可以不传'); // SDK接口：客户开始排队
        let queItem = this.allQueList.find((item) => {
          return item.queID == queID;
        });
        console.log(queItem);
        if (!!queItem) {
          this.queuingInfo.queID = queID;
          this.queuingInfo.name = queItem.name;
          this.queuingInfo.position = 0;
          this.queuingInfo.queuingTime = 0;
        }
      };
      // 客户开始排队的结果回调操作
      this.startQueuingRsltCallback = (sdkErr, cookie) => {
        console.log('开始排队的结果');
        console.log(sdkErr, cookie);
        if (sdkErr == 0) {
          this.queuingTimer = setInterval(() => {
            this.queuingInfo.queuingTime++;
          }, 1000);

          // layui 客户排队界面弹窗
          let timer,
            s = 0;
          let str = `<p style="text-align:center;">正在 <span style="color:#FD6F3F">${this.queuingInfo.name}</span> 排队中，已等待0秒</p><p style="text-align:center;"></p>`;
          this.queuingLayerIndex = win.layer.open({
            type: 0,
            closeBtn: 0,
            area: '300px',
            title: ['排队中...', 'font-size:16px;font-weight:500;'],
            content: str,
            btn: ['<span id="cancelQueuingBtn" style="font-size:14px;color:#fff;">取消排队</span>'],
            yes: (index, layero) => {
              // 点击取消排队触发
              win.CRVideo_StopQueuing('我是cookie，可以不传'); // SDK接口：客户取消排队
              win.layer.close(index);
              clearInterval(this.queuingTimer);
              clearInterval(timer);
            },
            end: () => {
              // 弹层关闭时触发
              clearInterval(this.queuingTimer);
              clearInterval(timer);
            },
            success: (layero, index) => {
              // 弹层显示后触发
              timer = setInterval(() => {
                s++;
                if (this.queuingInfo.position > 1) {
                  str = `<p style="text-align:center;">正在 <span style="color:#FD6F3F">${this.queuingInfo.name}</span> 排队中，已等待${this.queuingInfo.queuingTime}秒</p><p style="text-align:center;">您前面还有${this.queuingInfo.position - 1}人</p>`;
                } else {
                  str = `<p style="text-align:center;">正在 <span style="color:#FD6F3F">${this.queuingInfo.name}</span> 排队中，已等待${this.queuingInfo.queuingTime}秒</p><p style="text-align:center;">您已排到最前，请耐心等候</p>`;
                }
                $(layero).find('.layui-layer-content').html(str);
              }, 1000);
            },
          });
        } else {
          videoCall.alertLayer(`开始排队失败, errCode:${sdkErr}`);
        }
      };
      // 系统通知客户排队的信息有变化
      this.queuingInfoChangedHandler = (queuingInfoObj) => {
        console.log('排队信息变化');
        console.log(queuingInfoObj);
        let queItem = this.allQueList.find((item) => {
          return item.queID == queuingInfoObj.queID;
        });
        console.log(queItem);
        if (!!queItem) {
          this.queuingInfo.queID = queuingInfoObj.queID;
          this.queuingInfo.name = queItem.name;
          this.queuingInfo.position = queuingInfoObj.position;
          this.queuingInfo.queuingTime = queuingInfoObj.queuingTime;
        }
      };
      // 客户停止排队的结果回调操作
      this.stopQueuingRsltCallback = (sdkErr, cookie) => {};
    }
  }
  videoCall.allClass.queueClass = queueClass;
  videoCall.que = new videoCall.allClass.queueClass();
})(window, videoCall); // 呼叫模块

((win, videoCall) => {
  class callClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); // 注册SDK回调接口和通知接口
    }
    // 初始化数据
    initData() {
      this.isUserStatusNotify = false; // 是否开启用户状态推送
      this.callerInfo = {}; // 坐席（主叫）信息  {userID:xxx,nickname:xxx}
      this.beCalledInfo = {}; // 客户（被叫）信息
      this.callID = null; // 呼叫ID
      this.isDND = false; // 是否开启免打扰
      this.callType = 1; // 呼叫类型   2 排队呼叫   1 直接呼叫
      if (win.layuiForm !== undefined) {
        win.layuiForm.val('isDNDForm', {
          // 复原免打扰开关
          DNDSwitch: null,
        });
      }
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：回调 设置免打扰状态成功
      win.CRVideo_SetDNDStatusSuccess.callback = (cookie) => {
        this.setDNDStautsRsltCallback(0, cookie);
      };
      // SDK接口：回调 设置免打扰状态失败
      win.CRVideo_SetDNDStatusFail.callback = (sdkErr, cookie) => {
        this.setDNDStautsRsltCallback(sdkErr, cookie);
      };
      // SDK接口：回调 开启用户状态推送的结果
      win.CRVideo_StartUserStatusNotifyRslt.callback = (sdkErr, cookie) => {
        console.log(`开启用户状态推送成功，sdkErr: ${sdkErr}，cookie: ${cookie}`);
      };
      // SDK接口：回调 关闭用户状态推送的结果
      win.CRVideo_StopUserStatusNotifyRslt.callback = (sdkErr, cookie) => {
        console.log(`关闭用户状态推送成功，sdkErr: ${sdkErr}，cookie: ${cookie}`);
      };
      // SDK接口： 通知 系统推送用户的状态有变化
      win.CRVideo_NotifyUserStatus.callback = (CRVideo_UserStatus, cookie) => {
        this.notifyUserStatusHandler(CRVideo_UserStatus, cookie);
      };
      // SDK接口：回调 获取企业下所有用户的在线信息成功
      win.CRVideo_GetUserStatusSuccess.callback = (userStatusArr, cookie) => {
        console.log(`获取用户的在线信息成功`);
      };
      // SDK接口：回调 获取企业下所有用户的在线信息失败
      win.CRVideo_GetUserStatusFail.callback = (sdkErr, cookie) => {
        console.log(`获取用户的在线信息失败，sdkErr: ${sdkErr}，cookie: ${cookie}`);
      };
      // SDK接口：回调 呼叫成功
      win.CRVideo_CallSuccess.callback = (callID, cookie) => {
        this.callSucessCallback(callID, cookie);
      };
      // SDK接口：回调 呼叫失败
      win.CRVideo_CallFail.callback = (callID, sdkErr, cookie) => {
        this.callFailCallback(callID, sdkErr, cookie);
      };
      // SDK接口：通知 对方接受呼叫
      win.CRVideo_NotifyCallAccepted.callback = (callID, CRVideo_MeetInfoObj, userExtDat) => {
        this.notifyCallAcceptedHandler(callID, CRVideo_MeetInfoObj, userExtDat);
      };
      // SDK接口：通知 对方拒绝呼叫
      win.CRVideo_NotifyCallRejected.callback = (callID, sdkErr, userExtDat) => {
        this.notifyCallRejectHandler(callID, sdkErr, userExtDat);
      };
      // SDK接口：通知 收到对方发来的呼叫
      win.CRVideo_NotifyCallIn.callback = (callID, CRVideo_MeetInfoObj, callerID, userExtDat) => {
        // this.otherUserInfo.userID = callerID;
        this.callerInfo.userID = callerID;
        this.beCalledInfo.userID = videoCall.login.userID;
        this.beCalledInfo.nickname = videoCall.login.nickname;
        this.callID = callID;
        // 呼叫不带房间信息时，需要被叫来创建房间
        if (!CRVideo_MeetInfoObj) {
          videoCall.meetMgr.createMeetingFn('beCalled');
        } else {
          this.notifyCallInHandler(CRVideo_MeetInfoObj, userExtDat);
        }
      };
      // SDK接口：回调 接受呼叫成功
      win.CRVideo_AcceptCallSuccess.callback = (callID, cookie) => {
        this.acceptCallSuccesCallback(callID, cookie);
      };
      // SDK接口：回调 接受呼叫失败
      win.CRVideo_AcceptCallFail.callback = (callID, sdkErr, cookie) => {
        this.acceptCallFailCallback(callID, sdkErr, cookie);
      };
      // SDK接口：回调 挂断呼叫成功
      win.CRVideo_HangupCallSuccess.callback = (callID, cookie) => {
        this.hangupCallSuccessCallback(callID, cookie);
      };
      // SDK接口：回调 挂断呼叫失败
      win.CRVideo_HangupCallFail.callback = (callID, sdkErr, cookie) => {
        this.hangupCallFailCallback(callID, cookie);
      };
      // SDK接口：通知 通知呼叫被挂断
      win.CRVideo_NotifyCallHangup.callback = (callID, userExtDat) => {
        this.notifyCallHangupHandler(callID, userExtDat);
      };
    }
    // 开启or关闭免打扰状态
    setDNDStatus(isDND) {
      this.isDND = isDND; // 存储免打扰状态
      if (!!isDND) {
        win.CRVideo_SetDNDStatus(1, '开启'); // SDK接口: 设置免打扰状态 开启
      } else {
        win.CRVideo_SetDNDStatus(0, '关闭'); // SDK接口：设置免打扰状态 关闭
      }
    }
    // 设置免打扰状态的结果的回调
    setDNDStautsRsltCallback(sdkErr, cookie) {
      if (sdkErr == 0) {
        console.log(`设置免打扰状态成功: ${cookie}`);
        if (cookie == '关闭') {
          $('.user-state-monitor').hide();
        } else {
          $('.user-state-monitor').show();
        }
      } else {
        videoCall.alertLayer(`设置免打扰失败，错误码：${sdkErr}`);
      }
    }
    // 开启或关闭用户状态推送
    userStatusNotify() {
      if ($('.start-monitor').html() == '开启用户状态推送') {
        console.log('开启用户状态推送');
        $('.start-monitor').html('关闭用户状态推送').removeClass('start').addClass('stop');
        win.CRVideo_StartUserStatusNotify('我是cookie，可以不传');
      } else {
        console.log('关闭用户状态推送');
        $('.start-monitor').html('开启用户状态推送').removeClass('stop').addClass('start');
        win.CRVideo_StopUserStatusNotify('我是cookie，可以不传');
      }
    }
    // 通知用户状态变化
    notifyUserStatusHandler(userStatus, cookie) {
      const userID = userStatus.userID;
      let status, isDND;
      if (userStatus.DNDType == 0) {
        isDND = '未开启免打扰';
      } else {
        isDND = '已开启免打扰';
      }
      switch (userStatus.userStatus) {
        case 0:
          status = `离线了...`;
          break;
        case 1:
          status = `在线了，空闲中... ${isDND}`;
          break;
        case 2:
          status = `在线了，忙碌中... ${isDND}`;
          break;
        case 3:
          status = `在线了，正在房间中... ${isDND}`;
        default:
          status = `在线状态变化了，状态未知... ${isDND}`;
          break;
      }
      console.log(`用户 ${userID} ${status}`);
      videoCall.tipLayer(`用户 ${userID} ${status}`, 3000);
    }
    // 发起呼叫操作
    callFn(calledUserID, CRVideo_MeetInfoObj, userExtDat, cookie) {
      this.callerInfo.userID = videoCall.login.userID;
      this.callerInfo.nickname = videoCall.login.nickname;
      this.beCalledInfo.userID = calledUserID;
      win.CRVideo_Call(calledUserID, CRVideo_MeetInfoObj, userExtDat, cookie); // SDK接口：发起呼叫
    }
    // 呼叫成功的回调
    callSucessCallback(callID, cookie) {
      console.log(`呼叫成功，callID:${callID},cookie:${cookie}`);
      videoCall.tipLayer('呼叫成功，等待对方接听...');
      this.callID = callID;
    }
    // 呼叫失败的回调
    callFailCallback(callID, sdkErr, cookie) {
      console.log(`呼叫失败，callID:${callID},sdkErr:${sdkErr},cookie:${cookie}`);
      let errDesc = '';
      switch (sdkErr) {
        case 601:
          errDesc = '已在呼叫中';
          break;
        case 602:
          errDesc = '对方忙';
          break;
        case 603:
          errDesc = '对方不在线';
          break;
        case 605:
          errDesc = '用户不存在';
          break;
        default:
          break;
      }
      console.log(`呼叫失败：errCode:${sdkErr} ${errDesc}`);
      videoCall.alertLayer(`呼叫失败：errCode:${sdkErr} ${errDesc}`);
    }
    // 通知我对方接受了呼叫
    notifyCallAcceptedHandler(callID, meetInfoObj) {
      videoCall.meetMgr.meetInfo = meetInfoObj;
      videoCall.meetMgr.enterMeetFn(); // 进入房间
    }
    // 通知我呼叫被对方拒绝了
    notifyCallRejectHandler(callID, sdkErr, userExtDat) {
      switch (sdkErr) {
        case 604:
          videoCall.alertLayer(`对方无应答！`);
          break;

        default:
          videoCall.alertLayer(`对方拒绝了本次呼叫！Code:${sdkErr}`);
          break;
      }
    }
    // 通知我收到了对方的呼叫
    notifyCallInHandler(CRVideo_MeetInfoObj, userExtDat) {
      const that = this;
      videoCall.meetMgr.meetInfo = CRVideo_MeetInfoObj;
      $('#cancelQueuingBtn').click(); // 取消排队
      console.log(`收到呼叫：${userExtDat}`);
      if (userExtDat.includes('直接呼叫')) {
        // 手动接受呼叫
        videoCall.modalLayer('坐席呼叫', `收到坐席呼叫，是否接通？`, {
          btns: ['接受', '拒绝'],
          btn1Callback: function () {
            console.log('接受呼叫');
            clearInterval(videoCall.que.queuingTimer); // 清除排队定时器
            win.CRVideo_AcceptCall(that.callID, CRVideo_MeetInfoObj); // SDK接口：接受呼叫
          },
          btn2Callback: function () {
            console.log('拒绝呼叫');
            clearInterval(videoCall.que.queuingTimer); // 清除排队定时器
            win.CRVideo_RejectCall(that.callID); // SDK接口：拒绝呼叫
          },
        });
        
      } else {
        videoCall.tipLayer(`收到坐席呼叫，正在进入房间...`);
        // 自动接受呼叫
        this.acceptCallFn(that.callID, CRVideo_MeetInfoObj, '拓展数据', 'cookie'); // 接受呼叫
      }
    }
    // 被叫自己创建房间成功
    beCalledCreateMeetSuccess(CRVideo_MeetInfoObj, cookie) {
      this.notifyCallInHandler(CRVideo_MeetInfoObj, '');
    }
    // 接受对方呼叫
    acceptCallFn(callId, meetObj, userExtDat, cookie) {
      win.CRVideo_AcceptCall(callId, meetObj, userExtDat, cookie); // SDK接口：接受呼叫
    }
    // 接受对方呼叫成功的回调
    acceptCallSuccesCallback(callId, cookie) {
      console.log(`接受呼叫成功：${callId}, cookie:${cookie}`);
      videoCall.meetMgr.enterMeetFn(); // 进入房间
    }
    // 接受对方呼叫失败的回调
    acceptCallFailCallback(callId, sdkErr, cookie) {
      console.log(`接受呼叫失败：${callId}, errCode:${sdkErr}, cookie:${cookie}`);
      videoCall.alertLayer(`接受呼叫失败，errCode:${sdkErr}`);
    }
    // 挂断呼叫
    hungupCall() {
      videoCall.modalLayer('挂断', `是否结束本次通话？`, {
        btns: ['结束', '取消'],
        btn1Callback() {
          CRVideo_HangupCall(videoCall.call.callID, '正常挂断'); // SDK接口：挂断呼叫
        },
        btn2Callback() {
          return;
        },
      });
    }
    // 挂断呼叫成功的回调
    hangupCallSuccessCallback(callID, cookie) {
      console.log(`挂断呼叫成功,callID:${callID},cookie:${cookie}`);
      videoCall.meetMgr.exitMeeting(); // 退出房间
      videoCall.meetMgr.destroyMeeting(videoCall.meetMgr.meetInfo.ID); // 销毁房间
      if (videoCall.call.callType === 2) {
        // 呼叫类型为队列呼叫
        videoCall.que.showQuePage(); // 显示队列界面
      } else {
        // 呼叫类型为直接呼叫
        $('.call-page').show().siblings().hide(); // 显示呼叫模式选择界面
      }
      setTimeout(() => {
        videoCall.tipLayer(`呼叫挂断，本次通话已结束！`);
      }, 1000);
    }
    // 挂断呼叫失败的回调
    hangupCallFailCallback(callID, sdkErr, cookie) {
      console.log(`挂断呼叫失败,callID:${callID},sdkErr:${sdkErr},cookie:${cookie}`);
      videoCall.meetMgr.exitMeeting(); // 退出房间
      if (videoCall.call.callType === 2) {
        // 呼叫类型为队列呼叫
        videoCall.que.showQuePage(); // 显示队列界面
      } else {
        // 呼叫类型为直接呼叫
        $('.call-page').show().siblings().hide(); // 显示呼叫模式选择界面
      }
      setTimeout(() => {
        videoCall.meetMgr.destroyMeeting(videoCall.meetMgr.meetInfo.ID); // 销毁房间
      }, 5000);
    }
    // 通知我呼叫已被挂断
    notifyCallHangupHandler(callID, userExtDat) {
      console.log(`呼叫被挂断, ${userExtDat}`);
      videoCall.meetMgr.exitMeeting(); // 退出房间
      if (videoCall.call.callType === 2) {
        // 呼叫类型为队列呼叫
        videoCall.que.showQuePage(); // 显示队列界面
      } else {
        // 呼叫类型为直接呼叫
        $('.call-page').show().siblings().hide(); // 显示呼叫模式选择界面
      }
      setTimeout(() => {
        videoCall.alertLayer(`呼叫挂断，当前通话已结束！`);
      }, 1000);
    }
  }
  videoCall.allClass.callClass = callClass;
  videoCall.call = new videoCall.allClass.callClass();
})(window, videoCall); // 房间管理模块

((win, videoCall) => {
  class meetMgrClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); //注册回调
    }
    // 初始化数据
    initData() {
      this.meetInfo = {}; // 房间信息
      this.isMeeting = false; // 是否正在房间中
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：回调 创建房间成功
      win.CRVideo_CreateMeetingSuccess.callback = (CRVideo_MeetInfoObj, cookie) => {
        if (cookie == 'beCalled') {
          videoCall.call.beCalledCreateMeetSuccess(CRVideo_MeetInfoObj, cookie);
        } else {
          this.createMeetSuccessCallback(CRVideo_MeetInfoObj, cookie);
        }
      };
      // SDK接口：回调 创建房间失败
      win.CRVideo_CreateMeetingFail.callback = (sdkErr, cookie) => {
        this.createMeetFailCallback(sdkErr, cookie);
      };
      // SDK接口：回调 进入房间的结果
      win.CRVideo_EnterMeetingRslt.callback = (sdkErr, cookie) => {
        this.enterMeetingRsltCallback(sdkErr, cookie);
      };
      // SDK接口：通知 有成员进入房间
      win.CRVideo_UserEnterMeeting.callback = (userID) => {
        this.userEnterMeetingHandler(userID);
      };
      // SDK接口：通知 有成员离开房间
      win.CRVideo_UserLeftMeeting.callback = (userID) => {
        this.userLeftMeetingHandler(userID);
      };
      // SDK接口：回调 销毁房间的结果
      win.CRVideo_DestroyMeetingRslt.callback = (sdkErr, cookie) => {
        this.destroyMeetingRsltCallback(sdkErr, cookie);
      };
      // SDK接口：通知 通知房间已被结束
      win.CRVideo_MeetingStopped.callback = () => {
        this.meetingStoppedHandler();
      };
      // SDK接口：通知 从房间中掉线了
      win.CRVideo_MeetingDropped.callback = (sdkErr) => {
        this.meetingDroppedHandler(sdkErr);
      };
    }
    // 创建房间
    createMeetingFn(cookie) {
      videoCall.tipLayer('正在创建房间...');
      win.CRVideo_CreateMeeting2(cookie);
    }
    // 房间创建成功的回调
    createMeetSuccessCallback(CRVideo_MeetInfoObj, cookie) {
      console.log(`创建房间成功，开始呼叫... ${JSON.stringify(CRVideo_MeetInfoObj)}`);
      videoCall.tipLayer('创建房间成功，开始呼叫...');
      const userExDat = cookie.includes('直接呼叫') ? '直接呼叫' : '排队呼叫';
      videoCall.call.callFn(videoCall.call.beCalledInfo.userID, CRVideo_MeetInfoObj, userExDat, '我是cookie');
    }
    // 房间创建失败的回调
    createMeetFailCallback(sdkErr, cookie) {
      console.log(`创建房间失败, sdkErr:${sdkErr}, cookie:${cookie}`);
      videoCall.alertLayer(`创建房间失败：${sdkErr}`);
    }
    // 进入房间
    enterMeetFn(cookie) {
      // SDK接口：进入房间
      win.CRVideo_EnterMeeting3(this.meetInfo.ID, cookie);
    }
    // 进入房间的结果的回调
    enterMeetingRsltCallback(sdkErr, cookie) {
      if (sdkErr == 0) {
        videoCall.que.initQueue(); // 初始化队列
        setTimeout(() => {
          videoCall.que.startRefreshQueStatus(0); // 停止队列刷新
        }, 3000);
        console.log(`进入房间成功: ${cookie}`);
        this.isMeeting = true;

        if (videoCall.login.loginIdent === 0) {
          // 坐席身份
          videoCall.meeting.showMeetingPage('seat'); // 显示客户通话界面
        } else if (videoCall.login.loginIdent === 1) {
          // 客户身份
          videoCall.meeting.showMeetingPage(); // 显示客户通话界面
        }
        videoCall.mediaShare.createMediaUIObj(); // 创建影音共享组件

        // 只有默认账号下才展示录像文件管理界面
        document.querySelector('#recordTab').style.display = videoCall.login.appID == '默认' ? 'block' : 'none';
      } else {
        this.isMeeting = false;
        console.log(`进入房间失败，errCode:${sdkErr}，cookie:${cookie}`);
        let errDesc = '';
        switch (sdkErr) {
          case 205:
            errDesc = '没有可用的服务器！';
            break;
          case 800:
            errDesc = '房间不存在或已结束！';
            break;
          case 801:
            errDesc = '房间密码不正确！';
            break;
          case 802:
            errDesc = '服务器授权到期或超出并发数！';
            break;
          default:
            errDesc = '未知错误，请稍后再试！';
            break;
        }

        if (!!cookie && cookie.includes('reEnter')) {
          // 掉线重进房间
          videoCall.modalLayer('失败', `进入房间失败，${errDesc}，是否重试？`, {
            btns: ['重试', '取消'],
            btn1Callback() {
              videoCall.meetMgr.enterMeetFn(`reEnter`);
            },
            btn2Callback() {
              videoCall.meetMgr.meetingStoppedHandler();
              return;
            },
          });
          return;
        }

        // videoCall.alertLayer(`进入房间失败，${errDesc}`);
        videoCall.modalLayer('失败', `进入房间失败，${errDesc}，是否重试？`, {
          btns: ['重试', '取消'],
          btn1Callback() {
            videoCall.meetMgr.enterMeetFn();
          },
          btn2Callback() {
            return;
          },
        });
      }
    }
    // 通知有成员进入房间
    userEnterMeetingHandler(userID) {
      console.log(`成员进入房间：${userID}`);
      videoCall.meeting.setMeetingPageNickname(); //设置会话页顶部对方昵称
      if (userID === videoCall.call.callerInfo.userID) {
        !!videoCall.audioVideo.seatVideoUIObj && videoCall.audioVideo.setMemberVideo(videoCall.audioVideo.seatVideoUIObj, userID, -1);
      } else if (userID === videoCall.call.beCalledInfo.userID) {
        !!videoCall.audioVideo.userVideoUIObj && videoCall.audioVideo.setMemberVideo(videoCall.audioVideo.userVideoUIObj, userID, -1);
      }
    }
    // 通知有成员离开房间
    userLeftMeetingHandler(userID) {
      console.log(`成员离开房间：${userID}`);
    }
    // 离开房间
    exitMeeting() {
      if (videoCall.svrMixerMgr.recordState === 2) {
        // 录制中
        win.CRVideo_StopSvrMixer(); // SDK接口：停止录制、直播推流
      }
      if (videoCall.screenShare.sharerID === videoCall.login.userID) {
        // 自己共享屏幕
        win.CRVideo_StopScreenShare(); // SDK接口：停止屏幕共享
      }
      if (videoCall.mediaShare.isPlayingMedia === true && videoCall.mediaShare.isMySharing) {
        videoCall.mediaShare.stopMediaShare(); // 停止影音共享
      }
      win.CRVideo_ExitMeeting(); // SDK接口：退出房间
      this.isMeeting = false;
      videoCall.meeting.initData();
      videoCall.audioVideo.initData();
      videoCall.svrMixerMgr.initData();
      videoCall.screenShare.initData();
      videoCall.mediaShare.initData();
      videoCall.msgMgr.initData();
      videoCall.shuanglu.initData();

      $('#chatMsgList').html(''); // 清除聊天记录
      $('#RecordBtn').html('开始录制').removeClass('warning');
      $('#screenShareBtn').html('屏幕共享').removeClass('warning');
      $('.chat-box').hide(); // 隐藏聊天面板
      // $('.record-set').addClass('none').siblings('.set-main').removeClass('none'); // 切换视频设置面板
      // $('.list-record').addClass('none').siblings('.list').removeClass('none'); // 切换风险告知和录制文件管理面板
      $('.video-set-tab').click();
      $('.media-tab').click();
      $('.list-media ul').html(''); // 清空影音列表
      $('.list-record ul').html(''); // 清空录制文件列表
    }
    // 销毁房间
    destroyMeeting(meetID, cookie) {
      win.CRVideo_DestroyMeeting(meetID, cookie); // SDK接口：销毁房间
    }
    // 销毁房间的结果的回调
    destroyMeetingRsltCallback(sdkErr, cookie) {
      if (sdkErr == 0) {
        console.log(`房间销毁成功：${cookie}`);
        this.isMeeting = false;
      } else {
        console.log(`房间销毁失败：${sdkErr}, ${cookie}`);
      }
    }
    // 通知房间已被结束
    meetingStoppedHandler() {
      videoCall.meetMgr.isMeeting = false;
      if (videoCall.login.isLogin) {
        if (videoCall.call.callType === 2) {
          // 呼叫类型为队列呼叫
          videoCall.que.showQuePage(); // 显示队列界面
        } else {
          // 呼叫类型为直接呼叫
          $('.call-page').show().siblings().hide(); // 显示呼叫模式选择界面
        }
      } else {
        window.location.reload();
      }
    }
    // 通知从房间中掉线了
    meetingDroppedHandler(sdkErr) {
      videoCall.tipLayer(`从房间中掉线了`);
      this.enterMeetFn(`reEnter?1`);
    }
  }
  videoCall.allClass.meetMgrClass = meetMgrClass;
  videoCall.meetMgr = new videoCall.allClass.meetMgrClass();
})(window, videoCall); // 会话页面模块

((win, videoCall) => {
  class meetingClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); //注册回调
    }
    // 初始化数据
    initData() {
      this.layout = 'layoutA'; // 页面视频布局  两人视频 layoutA 共享中 layoutB 三人视频 layoutC
      this.videoFullScreenTimer = null; // 给video标签加上全屏事件的定时器
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {}
    // 进入会话界面
    showMeetingPage(isSeat) {
      this.setMeetingPageNickname(); // 设置会话页顶部对方昵称
      $('#roomID').html(videoCall.meetMgr.meetInfo.ID); // 设置顶部房间号
      $('.meeting-page').addClass(window.CRCALLDEMOTYPE); // 用来区分是呼叫Demo还是双录Demo，两个demo是同一套代码
      if (isSeat) {
        $('.meeting-page').addClass('seat').show().siblings().hide(); // 显示坐席会话界面
      } else {
        $('.meeting-page').removeClass('seat').show().siblings().hide(); // 显示坐席会话界面
      }

      videoCall.audioVideo.showCallerVideo(); // 显示坐席（主叫）的视频
      videoCall.audioVideo.showBeCalledVideo(); // 显示客户（被叫）的视频
      videoCall.audioVideo.onOffMic('on', videoCall.login.userID); // 打开自己的麦克风
      videoCall.audioVideo.onOffVideo('on', videoCall.login.userID); // 打开自己的摄像头
      this.setLayout(this.layout); // 视频布局
      this.videoFullScreenTimer = setInterval(function () {
        videoCall.shuanglu.requestVideoFullScreen(); // 给所有的video标签加上双击全屏事件
      }, 5000);
    }
    // 设置视频布局
    setLayout(layout) {
      this.layout = layout;
      $('.video-box').removeClass().addClass(`video-box ${layout}`);
    }
    // 设置会话页顶部对方昵称
    setMeetingPageNickname() {
      const allMembers = CRVideo_GetAllMembers(); // SDK接口：获取房间内所有成员信息
      if (allMembers.length > 1) {
        allMembers.forEach((item) => {
          if (item.userID !== videoCall.login.userID) {
            const nickname = win.CRVideo_GetMemberNickName(item.userID);
            $('#headerUserName').html(nickname);
          }
        });
      }
    }
    // 打开视频设置面板
    showVideoSetBox() {
      $('.set-box').show(100).siblings().hide(100);
      videoCall.audioVideo.getMyAllVideoInfo(); // 获取本地摄像头信息
      videoCall.audioVideo.getMyAllAudioInfo(); // 获取本地麦克风信息
      videoCall.audioVideo.getMyAllSpeakerInfo(); // 获取本地扬声器信息
      this.showCamList(); // 展示摄像头列表
      this.showMicList(); // 展示麦克风列表
      this.showSpeakerList(); // 展示扬声器列表
      videoCall.svrMixerMgr.showRecordSet(); // 录制设置表单赋值
    }
    // 展示摄像头列表
    showCamList() {
      // SDK接口：获取成员的默认摄像头
      const defaultVideoID = CRVideo_GetDefaultVideo(videoCall.login.userID);
      let str = '';
      videoCall.audioVideo.myAllVideoInfo.forEach((item) => {
        if (item.videoID == defaultVideoID) {
          str += `<option value=${item.videoID} selected>${item.videoName}</option>`;
        } else {
          str += `<option value=${item.videoID}>${item.videoName}</option>`;
        }
      });
      $('.video-set-camlist').html(str);
      win.layuiForm.render();
    }
    // 点击摄像头开关按钮
    onClickVideoOnOffBtn(btnDom) {
      const $this = $(btnDom);
      const userID = videoCall.login.userID;
      if ($this.html() === '关闭') {
        $this.html('开启').addClass('closed');
        videoCall.audioVideo.onOffVideo('off', userID); // 关闭摄像头
      } else {
        $this.html('关闭').removeClass('closed');
        videoCall.audioVideo.onOffVideo('on', userID); // 打开摄像头
      }
    }
    // 展示麦克风列表
    showMicList() {
      let str = '';
      const audioCfg = CRVideo_GetAudioCfg(); // SDK接口：获取当前音频设备参数
      videoCall.audioVideo.myAllAudioInfo.forEach((item) => {
        if (item.micID == audioCfg.micID) {
          str += `<option value=${item.micID} selected>${item.micName}</option>`;
        } else {
          str += `<option value=${item.micID}>${item.micName}</option>`;
        }
      });
      $('.video-set-miclist').html(str);
      win.layuiForm.render();
    }
    // 点击麦克风开关按钮
    onClickMicOnOffBtn(btnDom) {
      const $this = $(btnDom);
      const userID = videoCall.login.userID;
      if ($this.html() === '关闭') {
        $this.html('开启').addClass('closed');
        videoCall.audioVideo.onOffMic('off', userID); // 关闭麦克风
      } else {
        $this.html('关闭').removeClass('closed');
        videoCall.audioVideo.onOffMic('on', userID); // 打开麦克风
      }
    }
    // 展示扬声器列表
    showSpeakerList() {
      let str = '';
      const audioCfg = CRVideo_GetAudioCfg(); // SDK接口：获取当前音频设备参数
      videoCall.audioVideo.myAllSpeakerInfo.forEach((item) => {
        if (item.speakerID == audioCfg.speakerID) {
          str += `<option value=${item.speakerID} selected>${item.speakerName}</option>`;
        } else {
          str += `<option value=${item.speakerID}>${item.speakerName}</option>`;
        }
      });
      $('.video-set-speakerlist').html(str);
      win.layuiForm.render();
    }
    // 选择视频或录制设置tab
    toggleSetTab(dom, _class) {
      $(dom).addClass('checked').siblings('div').removeClass('checked');
      $(_class).removeClass('none').siblings('.set-main').addClass('none');
    }
    // 点击保存设置按钮
    saveSetting() {
      $('.set-box').hide(100);
      videoCall.svrMixerMgr.saveRecordSetData();
    }
    // 选择影音共享或者录制文件管理
    toggleMediaRecord(dom, _class) {
      $(dom).addClass('checked').siblings('div').removeClass('checked');
      $(_class).removeClass('none').siblings('.list').addClass('none');
    }
    // 点击结束服务按钮
    onClickHungUpBtn() {
      videoCall.call.hungupCall();
    }
    // 点击聊天按钮
    onClickChatBtn() {
      if ($('.chat-box').css('display') === 'block') {
        $('.chat-box').hide(100);
      } else {
        $('.chat-box').show(100).siblings().hide(100);
      }
    }
    // 点击邀请按钮
    onClickInviteBtn() {
      if ($('.invite-box').css('display') === 'block') {
        $('.invite-box').hide(100);
      } else {
        $('.invite-box').show(100).siblings().hide(100);
      }
    }
  }
  videoCall.allClass.meetingClass = meetingClass;
  videoCall.meeting = new videoCall.allClass.meetingClass();
})(window, videoCall); // 音视频管理模块

((win, videoCall) => {
  class audioVideoClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); //注册回调
    }
    // 初始化数据
    initData() {
      this.myAllVideoInfo = []; // 我的所有摄像头列表
      this.myAllAudioInfo = []; // 我的所有麦克风列表
      this.seatVideoUIObj = null; // 坐席UI显示组件
      this.userVideoUIObj = null; // 客户端UI显示组件
      this.thirdVideoUIObj = null; // 第三方成员UI显示组件
      this.videoStateNotify = false; // 第一次状态通知不提示
      this.audioStateNotify = false; // 第一次状态通知不提示
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：通知 成员的麦克风状态变化
      win.CRVideo_AudioStatusChanged.callback = (...args) => {
        this.audioStatusChangedHandler(...args);
      };
      // SDK接口：通知  成员的摄像头状态变化
      win.CRVideo_VideoStatusChanged.callback = (...args) => {
        this.videoStatusChangedHandler(...args);
      };
      // 通知打开摄像头失败
      win.CRVideo_OpenVideoFailed.callback = (errCode, errDesc) => {
        videoCall.alertLayer(`打开摄像头失败：${errDesc}`);
      };
      // 通知打开麦克风失败
      win.CRVideo_OpenMicFailed.callback = (errCode, errDesc) => {
        videoCall.alertLayer(`打开麦克风失败：${errDesc}`);
      };
    }
    // 订阅成员视频
    setMemberVideo(videoUIObj, UID, camID) {
      videoUIObj.setVideo(UID, camID); // 设置默认摄像头的视频流到该组件上
      videoUIObj.setNickNameStyle({
        // 设置该组件的昵称显示样式
        left: '10px',
        top: '10px',
        backgroundColor: 'rgba(0, 0, 0, .7)',
        padding: '0 10px',
        borderRadius: '15px',
        display: 'block',
      });
    }
    // 显示坐席（主叫）画面
    showCallerVideo() {
      let callerVideoUIObj = CRVideo_CreatVideoObj({
        // SDK接口：创建视频UI组件
        poster: './image/be_closed.jpg',
        style: {
          // objectFit: 'cover' //object-fit样式
        },
      });
      this.seatVideoUIObj = callerVideoUIObj;
      let videoUI = callerVideoUIObj.handler(); // 获取视频UI组件
      $('.seat-video').html(videoUI); // 将该组件放置在页面上
      this.setMemberVideo(this.seatVideoUIObj, videoCall.call.callerInfo.userID, -1);
    }
    // 显示客户（被叫）画面
    showBeCalledVideo() {
      let beCalledVideoUIObj = CRVideo_CreatVideoObj({
        // SDK接口：创建视频UI组件
        poster: './image/be_closed.jpg',
        style: {
          // objectFit: 'cover' //object-fit样式
        },
      });
      this.userVideoUIObj = beCalledVideoUIObj;
      let videoUI = beCalledVideoUIObj.handler(); // 获取视频UI组件
      $('.user-video').html(videoUI); // 将该组件放置在页面上
      this.setMemberVideo(this.userVideoUIObj, videoCall.call.beCalledInfo.userID, -1);
    }
    // 获取摄像头列表
    getMyAllVideoInfo() {
      this.myAllVideoInfo = win.CRVideo_GetAllVideoInfo(videoCall.login.userID); // SDK接口：获取用户的所有摄像头信息
    }
    // 获取麦克风列表
    getMyAllAudioInfo() {
      this.myAllAudioInfo = win.CRVideo_GetAudioMicNames(); // SDK接口：获取我的麦克风列表
    }
    // 获取扬声器列表
    getMyAllSpeakerInfo() {
      this.myAllSpeakerInfo = win.CRVideo_GetAudioSpkNames(); // SDK接口：获取我的扬声器列表
    }
    // 监听摄像头切换
    onCamChanged() {
      win.layuiForm.on('select(cameraList)', (data) => {
        // console.log(+data.value);
        win.CRVideo_SetDefaultVideo(videoCall.login.userID, +data.value); // SDK接口：设置默认摄像头
      });
    }
    // 监听麦克风切换
    onMicChanged() {
      win.layuiForm.on('select(micList)', (data) => {
        // console.log(+data.value);
        const cfg = {
          micID: +data.value,
        };
        win.CRVideo_SetAudioCfg(cfg); // SDK接口：设置音频参数
      });
    }
    // 监听扬声器切换
    onSpeakerChanged() {
      win.layuiForm.on('select(speakerList)', (data) => {
        // console.log(+data.value);
        const cfg = {
          speakerID: +data.value,
        };
        win.CRVideo_SetAudioCfg(cfg); // SDK接口：设置音频参数
      });
    }
    // 开关房间内成员的麦克风
    onOffMic(onOff, userID) {
      if (onOff == 'on') {
        win.CRVideo_OpenMic(userID); // SDK接口：打开麦克风
      } else {
        win.CRVideo_CloseMic(userID); // SDK接口：关闭麦克风
      }
    }
    // 开关房间内成员的摄像头
    onOffVideo(onOff, userID) {
      if (onOff == 'on') {
        win.CRVideo_OpenVideo(userID); // SDK接口：打开摄像头
      } else {
        win.CRVideo_CloseVideo(userID); // SDK接口：关闭摄像头
      }
    }
    // 监听设置面板视频参数变化
    onVideoCfgChanged() {
      // 视频尺寸
      win.layuiForm.on('select(videoSizeChange)', (data) => {
        console.log(`设置视频尺寸：${data.value}`);
        this.setVideoCfg({
          size: +data.value,
        });
      });
      // 视频比例
      win.layuiForm.on('radio(videoRateType)', (data) => {
        console.log(`设置视频比例：${data.value}`);
        this.setVideoCfg({
          ratio: +data.value,
        });
      });
      // 视频帧率
      $('#videoFps').on('change', (e) => {
        let fps = $('#videoFps').val();
        if (fps > 35) fps = 35;
        if (fps < 5) fps = 5;
        console.log(`设置视频尺寸：${fps}`);
        this.setVideoCfg({
          fps: +fps,
        });
      });
    }
    // 通知房间内成员的麦克风状态变化
    audioStatusChangedHandler(userID, oldStatus, newStatus) {
      console.log(`成员麦克风状态变化：userID:${userID}, oldStatus:${oldStatus}, newStatus:${newStatus}`);
      let userName = '';
      if (userID == videoCall.login.userID) {
        userName = '我';
        // 改变图标样式
        if (newStatus == 3) {
          $('.mic-onoff-btn').html('关闭').removeClass('closed');
        } else {
          $('.mic-onoff-btn').html('开启').addClass('closed');
        }
      } else {
        userName = CRVideo_GetMemberNickName(userID);
      }

      if (newStatus == 3 && oldStatus == 2) {
        if (this.audioStateNotify === true) {
          videoCall.tipLayer(`${userName} 打开了麦克风`);
        } else {
          this.audioStateNotify = true; // 第一次通知不提示
        }
      } else if (newStatus == 2 && oldStatus == 3) {
        videoCall.tipLayer(`${userName} 关闭了麦克风`);
      }
    }
    // 通知房间内成员的摄像头状态变化
    videoStatusChangedHandler(userID, oldStatus, newStatus) {
      console.log(`成员麦克风状态变化：userID:${userID}, oldStatus:${oldStatus}, newStatus:${newStatus}`);
      let userName = '';
      if (userID == videoCall.login.userID) {
        userName = '我';
        // 改变图标样式
        if (newStatus == 3) {
          $('.cam-onoff-btn').html('关闭').removeClass('closed');
        } else {
          $('.cam-onoff-btn').html('开启').addClass('closed');
        }
      } else {
        userName = CRVideo_GetMemberNickName(userID);
      }

      if (newStatus == 3 && oldStatus == 2) {
        if (this.videoStateNotify === true) {
          videoCall.tipLayer(`${userName} 打开了摄像头`);
        } else {
          this.videoStateNotify = true;
        }
      } else if (newStatus == 2 && oldStatus == 3) {
        videoCall.tipLayer(`${userName} 关闭了摄像头`);
      }
    }
    // 设置视频参数
    setVideoCfg(cfg) {
      win.CRVideo_SetVideoCfg(cfg); // SDK接口：设置视频参数
    }
    // 获取视频参数
    getVideoCfg() {
      const cfg = win.CRVideo_GetVideoCfg();
      console.log(`当前视频参数：${JSON.stringify(cfg)}`);
    }
    // 点击拍照按钮
    onClickSavePicBtn() {
      // if (videoCall.meeting.layout === 'layoutA') {
      const date = videoCall.getDate();
      const fileName = `${date.year}-${date.month}-${date.day}_${date.hour}_${date.minute}_${date.second}_WebRTC_${videoCall.meetMgr.meetInfo.ID}.png`;
      this.userVideoUIObj.savePic(fileName);
      // }
    }
  }
  videoCall.allClass.audioVideoClass = audioVideoClass;
  videoCall.audioVideo = new videoCall.allClass.audioVideoClass();
})(window, videoCall); // 录制管理模块

((win, videoCall) => {
  class svrMixerMgrClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); //注册回调
    }
    // 初始化数据
    initData() {
      this.recordState = 0; // 云端录制状态（混图器状态）  0 未开始  1启动中  2录制中
      this.curMixerID = null;
      this.recordCfg = {
        // 云端录制配置
        sizeType: 0, // 录像尺寸
        fps: 15, // 录像的帧率
        bitRate: 1000000, // 录像的最高码率
        defaultQP: 18, // 录像的目标质量 0-51
        aChannelType: 0, // 单录音声道类型  0:单声道 1:双声道
        isLivePush: false, // 是否开启推流
        livePushUrl: '', // 直播推流地址
      };
      this.recordSize = [
        // 录像尺寸列表
        [1280, 720],
      ];
      this.recordFileInfoList = []; // 当前录像文件列表（每次录制结束后，从服务端查询得到）
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：通知 某个云端录制混图器状态变化
      win.CRVideo_CloudMixerStateChanged.callback = (ID, status, exParam, UID) => {
        this.cloudMixerStateChangedHandler(status, UID);
      };
      // SDK接口：通知 某个云端录制混图器信息变化
      win.CRVideo_CloudMixerInfoChanged.callback = (ID) => {
        // console.log(`云端录制信息变化，ID:${ID}`);
        // this.getAllCloudMixerInfo();
      };
      // SDK接口：通知 某个云端录制混图器输出变化
      win.CRVideo_CloudMixerOutputInfoChanged.callback = (ID, jsonState) => {
        this.cloudMixerOutputInfoChangedHandler(jsonState);
      };
    }
    // 展示录制设置面板
    showRecordSet() {
      const { frameRate, isLivePush, bitRate, livePushUrl, sizeType, aChannelType } = this.recordCfg;
      win.layuiForm.val('recordSetBox', {
        // layui表单赋值
        fps: frameRate,
        livePushSwitch: isLivePush,
        maxBps: bitRate / 1000,
        pushUrl: livePushUrl,
        recordSize: sizeType,
        recordType: '1',
        aChannelType: aChannelType,
      });
      win.layuiForm.on('switch(livePushSwitch)', (data) => {
        if (data.elem.checked) {
          $('#pushUrlInput').removeAttr('disabled');
        } else {
          $('#pushUrlInput').attr('disabled', 'disabled');
        }
      });
    }
    // 保存录制设置参数
    saveRecordSetData() {
      const recordSetData = win.layuiForm.val('recordSetBox'); // layui表单取值
      this.recordCfg.sizeType = +recordSetData.recordSize;
      this.recordCfg.frameRate = +recordSetData.fps;
      this.recordCfg.bitRate = +recordSetData.maxBps * 1000;
      this.recordCfg.isLivePush = recordSetData.livePushSwitch === undefined ? false : true;
      this.recordCfg.aChannelType = +recordSetData.aChannelType;
      this.recordCfg.livePushUrl = recordSetData.pushUrl;
    }
    //更新云端录制参数
    updateCloudMixerContent() {
      if (this.curMixerID) {
        const json = {
          videoFileCfg: {
            layoutConfig: this.createLayoutConfig(),
          },
        };
        win.CRVideo_UpdateCloudMixerContent(this.curMixerID, json);
      }
    }
    //创建云端录制视频布局对象
    createLayoutConfig() {
      const { sizeType } = this.recordCfg;
      const [W, H] = this.recordSize[sizeType];

      const layoutConfig = [];

      // 两人通话布局，当前没有影音共享也没有屏幕共享
      if (videoCall.screenShare.sharerID === '' && videoCall.mediaShare.isPlayingMedia === false) {
        // 添加坐席画面
        layoutConfig.push({
          type: 0, // 录制内容类型：视频
          left: 0,
          top: 0,
          width: W / 2,
          height: H,
          keepAspectRatio: 1,
          param: {
            camid: `${videoCall.call.callerInfo.userID}.-1`,
          },
        });

        // 添加客户画面
        layoutConfig.push({
          type: 0, // 录制内容类型：视频
          left: W / 2,
          top: 0,
          width: W / 2,
          height: H,
          keepAspectRatio: 1,
          param: {
            camid: `${videoCall.call.beCalledInfo.userID}.-1`,
          },
        });
        // 添加坐席昵称
        layoutConfig.push({
          type: 10, // 录制内容类型：文本
          left: 40,
          top: 50,
          param: {
            text: `坐席：${win.CRVideo_GetMemberInfo(videoCall.call.callerInfo.userID).nickname}`,
            color: '#FD6F3F',
            'font-size': 18,
          },
        });
        // 添加客户昵称
        layoutConfig.push({
          type: 10, // 录制内容类型：文本
          top: 50,
          left: W / 2 + 40,
          param: {
            text: `客户：${win.CRVideo_GetMemberInfo(videoCall.call.beCalledInfo.userID).nickname}`,
            color: '#FD6F3F',
            'font-size': 18,
          },
        });
      } else {
        // 共享布局，当前有影音共享或者屏幕共享
        const userWidth = W / 3;
        const mediaWidth = userWidth * 2;
        if (videoCall.screenShare.sharerID !== '') {
          // 屏幕共享画面
          layoutConfig.push({
            type: 5, // 录制内容类型：共享中的屏幕
            left: 0,
            top: 0,
            width: mediaWidth, // 录像宽度的2/3
            height: H,
            keepAspectRatio: 1,
          });
          // 屏幕共享昵称
          layoutConfig.push({
            type: 10, // 录制内容类型：文本
            left: 40,
            top: 50,
            param: {
              text: `${win.CRVideo_GetMemberInfo(videoCall.screenShare.sharerID).nickname}的屏幕`,
              color: '#FD6F3F',
              'font-size': 18,
            },
          });
        } else if (videoCall.mediaShare.isPlayingMedia === true) {
          // 影音共享画面
          layoutConfig.push({
            type: 3, // 录制内容类型：共享中的影音
            left: 0,
            top: 0,
            width: mediaWidth, // 录像宽度的2/3
            height: H,
            keepAspectRatio: 1,
          });
          // 影音共享昵称
          layoutConfig.push({
            type: 10, // 录制内容类型：文本
            left: 40,
            top: 50,
            param: {
              text: `影音共享`,
              color: '#FD6F3F',
              'font-size': 18,
            },
          });
        }
        // 坐席画面
        layoutConfig.push({
          type: 0, // 录制内容类型：视频
          left: mediaWidth,
          top: 0,
          width: userWidth, // 录像宽度的1/3
          height: H / 2, // 屏幕共享内容的一半
          keepAspectRatio: 1,
          param: {
            camid: `${videoCall.call.callerInfo.userID}.-1`,
          },
        });
        // 客户画面
        layoutConfig.push({
          type: 0, // 录制内容类型：视频
          left: mediaWidth,
          top: H / 2,
          width: userWidth,
          height: H / 2,
          keepAspectRatio: 1,
          param: {
            camid: `${videoCall.call.beCalledInfo.userID}.-1`,
          },
        });
        // 坐席昵称
        layoutConfig.push({
          type: 10, // 录制内容类型：文本
          left: mediaWidth + 40,
          top: 15,
          param: {
            text: `坐席：${videoCall.call.callerInfo.nickname}`,
            color: '#FD6F3F',
            'font-size': 18,
          },
        });
        // 客户昵称
        layoutConfig.push({
          type: 10, // 录制内容类型：文本
          left: mediaWidth + 40,
          top: H / 2 + 15,
          param: {
            text: `客户：${win.CRVideo_GetMemberInfo(videoCall.call.beCalledInfo.userID).nickname}`,
            color: '#FD6F3F',
            'font-size': 18,
          },
        });
      }
      // 添加时间戳
      layoutConfig.push({
        type: 10, // 录制内容类型：时间戳
        left: W - 400,
        top: H - 60,
        param: {
          text: '当前时间: %timestamp%',
          'font-size:': 30,
        },
      });

      return layoutConfig;
    }
    //创建云端录制配置对象
    createCfg() {
      const { year, month, day, hour, minute, second } = videoCall.getDate();
      const fileName = `/${year}-${month}-${day}/${year}-${month}-${day}_${hour}_${minute}_${second}_web_${videoCall.meetMgr.meetInfo.ID}`;

      const mp4NameArr = [`${fileName}.mp4`];
      const { fps, bitRate, defaultQP, sizeType, aChannelType, isLivePush, livePushUrl } = this.recordCfg;
      const [W, H] = this.recordSize[sizeType];

      // 开启了互动直播推流
      if (isLivePush) {
        mp4NameArr.push(livePushUrl);
      }
      const aChannel = {};
      if (aChannelType === 1) {
        aChannel.aChannelType = aChannelType;
        aChannel.aChannelContent = [videoCall.call.callerInfo.userID, videoCall.call.beCalledInfo.userID];
      }

      //录制一个2分屏左右布局图像+房间声音的mp4文件
      const cfg = {
        mode: 0, //合流模式录制
        videoFileCfg: {
          svrPathName: mp4NameArr.join(';'),
          vWidth: W,
          vHeight: H,
          vFps: fps, //视频帧率，可不传
          vBps: bitRate, //视频码率，可不传
          vQP: defaultQP, //视频质量，可不传
          layoutConfig: this.createLayoutConfig(),
          ...aChannel,
        },
        audioFileCfg: {
          svrPathName: `${fileName}.mp3`,
          ...aChannel,
        },
      };
      return cfg;
    }
    // 点击录制按钮
    onClickRecordBtn(dom) {
      console.log($(dom).html());
      if ($(dom).html() === '开始录制') {
        const cfg = this.createCfg();
        // SDK接口：启动录制
        this.curMixerID = win.CRVideo_CreateCloudMixer(cfg);
      } else {
        this.curMixerID && win.CRVideo_DestroyCloudMixer(this.curMixerID); // SDK接口：停止录制、直播推流
        this.curMixerID = null;
      }
    }
    // 通知录制状态变化
    cloudMixerStateChangedHandler(STATE, UID) {
      console.log(`混图器状态变化：${STATE}`);
      this.recordState = STATE;
      switch (STATE) {
        case 0: // NO_RECORD
          $('#RecordBtn').html('开始录制').removeClass('warning');
          break;

        case 1: // STARTING
          $('#RecordBtn').html('正在启动录制..');
          break;

        case 2: // RECORDING
          videoCall.tipLayer(`云端录制已启动，正在录制中..`);
          $('#RecordBtn').html('停止录制').addClass('warning');
          break;

        case 3: // PAUSED
          $('#RecordBtn').html('已暂停');
          break;

        case 4: // STOPPING
          $('#RecordBtn').html('正在停止录制..');
          break;

        default:
          $('#RecordBtn').html('开始录制');
          break;
      }
    }
    // 录制文件状态变化
    cloudMixerOutputInfoChangedHandler(jsonState) {
      console.log(`混图器输出：${JSON.stringify(jsonState)}`);
      const status = jsonState.state;
      switch (status) {
        case 1:
          break;
        case 2:
          break;
        case 3:
          videoCall.alertLayer(`录制出错！错误码：${jsonState.errCode}`);
          break;
        case 4:
          break;
        case 5:
          break;
        case 6:
          videoCall.alertLayer(`录制文件上传出错！错误码：${jsonState.errCode}`);
          break;
        case 7:
          videoCall.tipLayer('录制完成');
          setTimeout(() => {
            this.getRecordFileInfo(jsonState.svrFilePathName);
          }, 2000);
          break;
        default:
          break;
      }
    }
    // 查询录像信息
    getRecordFileInfo(filePathName) {
      // 接口用法请参考SDK开发文档-服务端API
      const url = `https://sdk.${window.__CRName}.com/${window.__CRNameUP}-API/netDisk/query`;
      const data = {
        RequestId: new Date().getTime(),
        CompID: 213213, // CompID和CompSecret在管理后台右上角【WEB API】获取，每个账号都不一样，请替换为实际值
        SecretKey: md5(`213213&7859f2ee1064f3fac228b1792f8ca48b`), // SecretKey=MD5(CompID+'&'+CompSecret)
        FileName: filePathName,
      };
      $.ajax({
        url: url,
        data: data,
        dataType: 'jsonp',
        jsonp: 'callback',
        success: function (res) {
          if (res.RspCode == 0) {
            if (res.Data && res.Data.fileList && res.Data.fileList.length == 1) {
              const fileInfo = res.Data.fileList[0];
              console.log(fileInfo.downUrl);
              videoCall.svrMixerMgr.recordFileInfoList.push(fileInfo);
              $('.list-record ul').append(`
                            <li>
                                <div class="name">${videoCall.svrMixerMgr.recordFileInfoList.length}、${fileInfo.fileName}</div>
                                <div class="play-btns">
                                <span class="play icon" onclick="videoCall.svrMixerMgr.onClickPlayBtn(this,'play',${fileInfo.id})"></span>
                                    <span class="stop icon" onclick="videoCall.svrMixerMgr.onClickPlayBtn(this,'stop',${fileInfo.id})"></span>
                                </div>
                            </li>`);
            }
          }
        },
        error: function (err) {
          throw err;
        },
      });
    }
    // 播放录像回放
    onClickPlayBtn(dom, type, id) {
      if (type === 'play') {
        // 点击的是播放按钮
        // if ($(dom).hasClass('pause')) return;
        if ($('.record-play-btn').hasClass('pause')) return; // 已经有录像在播放了，只能先停止，才能播放
        let url;
        this.recordFileInfoList.forEach((item) => {
          if (item.id === id) {
            url = item.downUrl;
          }
        });
        if (!url || videoCall.mediaShare.isPlayingMedia || videoCall.screenShare.sharerID != '') return;
        $('.media-video').html('');
        $('.media-video').append($(`<video autoplay src="${url}" controls loop preload style="height:100%;width:100%">`));
        $(dom).removeClass('play').addClass('pause');
        videoCall.meeting.setLayout('layoutB');
      } else {
        // 点击的是停止按钮
        if ($(dom).siblings().hasClass('pause')) {
          $(dom).siblings().removeClass('pause').addClass('play');
          if (videoCall.mediaShare.isPlayingMedia || videoCall.screenShare.sharerID != '') return;
          $('.media-video').html('');
          videoCall.meeting.setLayout('layoutA');
        }
      }
    }
  }
  videoCall.allClass.svrMixerMgrClass = svrMixerMgrClass;
  videoCall.svrMixerMgr = new videoCall.allClass.svrMixerMgrClass();
})(window, videoCall); // 屏幕共享模块

((win, videoCall) => {
  class screenShareClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); //注册回调
    }
    // 初始化数据
    initData() {
      this.sharerID = ''; // 共享者ID  不为空表示房间中正在屏幕共享
      this.screenShareObj = null; // 屏幕共享UI显示UI组件
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：通知 房间内开启了屏幕共享
      win.CRVideo_NotifyScreenShareStarted.callback = (UID) => {
        this.notifyScreenShareStartedHandler(UID);
      };
      // SDK接口：通知 房间内停止了屏幕共享
      win.CRVideo_NotifyScreenShareStopped.callback = (UID) => {
        this.notifyScreenShareStoppedHandler(UID);
      };
    }
    // 点击屏幕共享按钮
    onClickScreenShareBtn(dom) {
      if ($('.record-play-btn').hasClass('pause')) {
        videoCall.tipLayer(`当前正在播放录像回放，请先停止！`);
        return;
      }
      if ($(dom).html() === '屏幕共享') {
        if (this.sharerID !== '') {
          videoCall.tipLayer(`当前房间内已经有人在共享屏幕了！`);
        } else if (videoCall.mediaShare.isPlayingMedia === true) {
          videoCall.tipLayer(`当前正在影音共享，不能同时共享屏幕，请先停止！`);
        } else {
          win.CRVideo_StartScreenShare(); // SDK接口：开始屏幕共享
        }
      } else {
        win.CRVideo_StopScreenShare(); // SDK接口：停止屏幕共享
      }
    }
    // 通知房间内开启了屏幕共享
    notifyScreenShareStartedHandler(sharerID) {
      videoCall.shuanglu.exitFullscreen(); // 如果正在全屏状态，就退出全屏
      videoCall.shuanglu.requestVideoFullScreen(); // 重新立即注册双击全屏事件
      this.sharerID = sharerID;
      if (sharerID === videoCall.login.userID) {
        $('#screenShareBtn').html('停止共享').addClass('warning');
        // return;
      }
      this.screenShareObj = win.CRVideo_CreatScreenShareObj({
        // SDK接口：创建屏幕共享UI显示组件
        poster: './image/get_screen.jpg',
      });
      $('.media-video').html(this.screenShareObj.handler()); // 获取显示组件DOM并放置到页面上
      this.screenShareObj.setVideo(sharerID); // 设置组件显示内容
      this.screenShareObj.setNickNameStyle({
        // 设置该组件的昵称显示样式
        left: '10px',
        top: '10px',
        backgroundColor: 'rgba(0, 0, 0, .7)',
        padding: '0 10px',
        borderRadius: '15px',
        display: 'block',
      });
      this.screenShareObj.setNickNameContent(`${win.CRVideo_GetMemberInfo(sharerID).nickname}的屏幕`); // 设置组件显示的昵称内容
      this.screenShareObj.setVisibleNickName(true); // 设置组件是否显示昵称
      videoCall.meeting.setLayout('layoutB'); // 调整界面布局

      if (videoCall.svrMixerMgr.recordState === 2) {
        // 云端录制中
        videoCall.svrMixerMgr.updateCloudMixerContent(); // 更新录制参数
      }
    }
    // 通知房间内停止了屏幕共享
    notifyScreenShareStoppedHandler(UID) {
      videoCall.shuanglu.exitFullscreen(); // 如果正在全屏状态，就退出全屏
      videoCall.shuanglu.requestVideoFullScreen(); // 重新立即注册双击全屏事件
      videoCall.meeting.setLayout('layoutA');
      this.sharerID = '';
      // $('.media-video').html("");
      $('#screenShareBtn').html('屏幕共享').removeClass('warning');

      if (videoCall.svrMixerMgr.recordState === 2) {
        // 云端录制中
        videoCall.svrMixerMgr.updateCloudMixerContent(); // 更新录制参数
      }
    }
  }
  videoCall.allClass.screenShareClass = screenShareClass;
  videoCall.screenShare = new videoCall.allClass.screenShareClass();
})(window, videoCall); // 影音共享模块

((win, videoCall) => {
  class mediaShareClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); // 注册回调
    }
    // 初始化数据
    initData() {
      this.mediaUIObj = null; // 影音共享UI显示对象
      this.mediaFiles = []; // 影音文件列表
      this.isPlayingMedia = false; // 当前是否正在播放影音共享
      this.isMySharing = false; // 是否是我这端在共享
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：通知 影音文件打开
      win.CRVideo_NotifyMediaOpened.callback = () => {
        this.notifyMediaOpenedHandler();
      };
      // SDK接口：通知 影音开始播放
      win.CRVideo_NotifyMediaStart.callback = (UID) => {
        this.notifyMediaStartHandler(UID);
      };
      // SDK接口：通知 影音停止播放
      win.CRVideo_NotifyMediaStop.callback = () => {
        this.notifyMediaStop();
      };
      // SDK接口：通知 影音播放暂停/取消暂停
      win.CRVideo_NotifyMediaPause.callback = (UID, status) => {
        this.notifyMediaPause(UID, status);
      };
    }
    // 创建影音共享组件
    createMediaUIObj() {
      // SDK接口：创建影音共享UI组件
      this.mediaUIObj = win.CRVideo_CreatMediaObj();
    }
    // 载入影音文件
    onLoadMediaFiles(dom) {
      let List = [];
      for (let x = 0; x < dom.files.length; x++) {
        List.push(dom.files[x]);
      }
      List.forEach((file) => {
        let isNew = true;
        this.mediaFiles.forEach((item) => {
          if (item.name === file.name) {
            isNew = false;
          }
        });
        if (!isNew) return;
        this.mediaFiles.push(file);
        this.mediaFiles[this.mediaFiles.length - 1].id = this.mediaFiles.length;
        $('.list-media ul').append(`
                <li>
                    <div class="name">${this.mediaFiles.length}、${file.name}</div>
                    <div class="play-btns">
                        <span class="play icon playpuse-btn" onclick="videoCall.mediaShare.onClickPlayBtn(this,${this.mediaFiles[this.mediaFiles.length - 1].id},'play')"></span>
                        <span class="stop icon stop-btn" onclick="videoCall.mediaShare.onClickPlayBtn(this,${this.mediaFiles[this.mediaFiles.length - 1].id},'stop')"></span>
                    </div>
                </li> 
                `);
      });
    }
    // 点击播放、停止按钮
    onClickPlayBtn(dom, id, isPlay) {
      if ($('.record-play-btn').hasClass('pause')) {
        videoCall.tipLayer(`当前正在播放录像回放，请先停止！`);
        return;
      }
      if (isPlay === 'play') {
        // 点击播放按钮
        if ($(dom).hasClass('play')) {
          // 未播放状态点播放按钮（有暂停和停止两种状态）
          if ($(dom).hasClass('play-pause')) {
            // 目前是暂停状态
            win.CRVideo_PausePlayMedia(false); // SDK接口：取消暂停，恢复播放
            $(dom).addClass('pause').removeClass('play').removeClass('play-pause');
          } else {
            // 目前是停止状态
            if (videoCall.screenShare.sharerID !== '') {
              videoCall.tipLayer(`房间内当前正在屏幕共享，无法播放影音！`);
              return;
            }
            if (this.isPlayingMedia === true) {
              videoCall.tipLayer(`当前正在播放影音，请先停止！`);
              return;
            }
            const File = this.mediaFiles[id - 1];
            console.log(File);
            const status = win.CRVideo_StartPlayMedia(this.mediaUIObj, File, 0, 0); // SDK接口：开始播放影音
            if (status !== 0) {
              $(dom).addClass('pause').removeClass('play').removeClass('play-pause');
              this.isPlayingMedia = true;
            } else {
              videoCall.tipLayer(`播放失败，不支持该视频格式`);
            }
          }
        } else if ($(dom).hasClass('pause')) {
          // 播放状态点击播放按钮
          win.CRVideo_PausePlayMedia(true); // SDK接口：暂停播放
          $(dom).addClass('play').addClass('play-pause').removeClass('pause');
        }
      } else {
        // 点击停止播放按钮
        this.stopMediaShare();
      }
    }
    // 停止共享影音
    stopMediaShare(isNotify = false) {
      if (this.isMySharing === false) return;
      $('.playpuse-btn').addClass('play').removeClass('play-pause').removeClass('pause');
      if(!isNotify) win.CRVideo_StopPlayMedia(); // SDK接口：停止影音共享
      this.isPlayingMedia = false;
      this.isMySharing = false;
    }
    // 通知影音文件打开（共享端收到此通知）
    notifyMediaOpenedHandler() {
      console.log(`影音文件打开了`);
      $('.media-video').html(this.mediaUIObj.handler()); // 将UI组件放置到页面上
      videoCall.meeting.setLayout('layoutB');
    }
    // 通知影音开始播放（收看端收到此通知）
    notifyMediaStartHandler(UID) {
      console.log(`影音开始播放: ${UID}`);
      videoCall.shuanglu.exitFullscreen(); // 如果正在全屏状态，就退出全屏
      videoCall.shuanglu.requestVideoFullScreen(); // 重新立即注册双击全屏事件
      this.sharerID = UID;
      this.isMySharing = UID === videoCall.login.userID ? true : false;
      this.mediaUIObj.setVideo(UID);
      $('.media-video').html(this.mediaUIObj.handler()); // 将UI组件放置到页面上
      videoCall.meeting.setLayout('layoutB');

      if (videoCall.svrMixerMgr.recordState === 2) {
        // 录制中
        videoCall.svrMixerMgr.updateCloudMixerContent(); // 更新录制内容
      }
    }
    // 通知影音停止播放
    notifyMediaStop() {
      console.log(`影音播放停止`);
      videoCall.shuanglu.exitFullscreen(); // 如果正在全屏状态，就退出全屏
      videoCall.shuanglu.requestVideoFullScreen(); // 重新立即注册双击全屏事件
      videoCall.meeting.setLayout('layoutA');
      this.stopMediaShare(true);
      if (videoCall.svrMixerMgr.recordState === 2) {
        // 录制中
        videoCall.svrMixerMgr.updateCloudMixerContent(); // 更新录制内容
      }
    }
    // 通知影音播放暂停、取消暂停
    notifyMediaPause(UID, status) {
      if (status == 0) {
        console.log(`影音播放恢复`);
      } else {
        console.log(`影音播放暂停`);
      }
    }
  }
  videoCall.allClass.mediaShareClass = mediaShareClass;
  videoCall.mediaShare = new videoCall.allClass.mediaShareClass();
})(window, videoCall); // 消息管理模块

((win, videoCall) => {
  class msgMgrClass {
    constructor() {
      this.initData(); // 初始化数据
      this.registerCallback(); //注册回调
    }
    // 初始化数据
    initData() {
      this.lastMsgID = null; // 最后发送的一条消息ID
      this.msgList = []; // [{UID: xxx, msg: xxx}] 聊天消息列表
    }
    // 注册SDK回调接口和通知接口
    // 只有注册了才能收到SDK的回调
    registerCallback() {
      // SDK接口：回调 发送广播消息成功
      win.CRVideo_SendMeetingCustomMsgRslt.callback = (...args) => {
        this.sendMeetingCustomMsgRsltCallback(...args);
      };
      // SDK接口：通知 收到房间内广播消息
      win.CRVideo_NotifyMeetingCustomMsg.callback = (...args) => {
        this.notifyMeetingCustomMsgHandler(...args);
      };
      // SDK接口：回调 发送点对点透明消息的结果
      win.CRVideo_SendCmdRslt.callback = (...args) => {
        this.sendCmdRsltCallback(...args);
      };
      // SDK接口：通知 收到点对点消息
      win.CRVideo_NotifyCmdData.callback = (...args) => {
        this.notifyCmdDataHandler(...args);
      };
    }
    // 点击发送按钮
    onClickSendBtn(e) {
      e.stopPropagation(); // 阻止冒泡
      const msgVal = $('#msgValue').val();
      if (msgVal === '' || this.lastMsgID !== null) return;
      if (window.CRCALLDEMOTYPE === 'record') this.sendMeetingCustomMsg(msgVal); // 双录demo，发送广播消息
      if (window.CRCALLDEMOTYPE === 'videoCall') this.sendCmd(msgVal); // 呼叫demo，发送命令
    }
    // 发送广播消息（双录demo）
    sendMeetingCustomMsg(msgVal) {
      const stringMsg = JSON.stringify({
        CmdType: 'IM',
        IMMsg: msgVal,
      });
      const cookie = new Date().getTime();
      this.lastMsgID = cookie;
      win.CRVideo_SendMeetingCustomMsg(stringMsg, cookie); // SDK接口：发送房间内广播消息
    }
    // 发送广播消息的结果
    sendMeetingCustomMsgRsltCallback(sdkErr, cookie) {
      if (sdkErr == 0 && cookie == this.lastMsgID) {
        $('#msgValue').val(''); // 清空输入框
      }
      this.lastMsgID = null;
    }
    // 通知收到房间内广播消息
    notifyMeetingCustomMsgHandler(fromeUID, stringMsg) {
      let jsonMsg = {};
      try {
        jsonMsg = JSON.parse(stringMsg);
      } catch (e) {
        console.error(e);
      }
      if (jsonMsg['CmdType'] === undefined || jsonMsg['IMMsg'] === undefined || jsonMsg['CmdType'] !== 'IM') return;
      const msg = jsonMsg.IMMsg;
      this.showMsg(fromeUID, msg);
    }
    // 展示消息到页面上
    showMsg(fromeUID, msg) {
      this.msgList.push({
        UID: fromeUID,
        msg: msg,
      });
      let classStr = 'item-left';
      if (fromeUID === videoCall.login.userID) {
        classStr = 'item-right';
      }
      const T = videoCall.getDate();
      $('#chatMsgList').append(`
                <li class=${classStr}>
                    <div class="nickname">${win.CRVideo_GetMemberNickName(fromeUID)} [${T.hour}:${T.minute}:${T.second}]</div>
                    <div class="msg-value">
                        ${msg}
                    </div>
                </li>
            `);
      $('.chat-msg-box').scrollTop($('#chatMsgList').height());
      if ($('.chat-box').css('display') === 'none') videoCall.tipLayer(`收到新的聊天消息，请查看..`);
    }
    // 发送点对点消息（呼叫demo）
    sendCmd(cmd) {
      const UID = videoCall.login.loginIdent === 0 ? videoCall.call.beCalledInfo.userID : videoCall.call.callerInfo.userID;
      const cookie = new Date().getTime();
      this.lastMsgID = cookie;
      win.CRVideo_SendCmd(UID, cmd, cookie);
    }
    // 发送点对点消息的结果
    sendCmdRsltCallback(taskID, sdkErr, cookie) {
      if (sdkErr == 0 && cookie == this.lastMsgID) {
        this.showMsg(videoCall.login.userID, $('#msgValue').val());
        $('#msgValue').val(''); // 清空输入框
      }
      this.lastMsgID = null;
    }
    // 通知收到点对点消息
    notifyCmdDataHandler(UID, data) {
      this.showMsg(UID, data);
    }
  }

  videoCall.allClass.msgMgrClass = msgMgrClass;
  videoCall.msgMgr = new videoCall.allClass.msgMgrClass();
})(window, videoCall); // 非SDK相关

((win, videoCall) => {
  class shuangluClass {
    constructor() {}
    // 初始化数据
    initData() {}
    // 切换身份证图片
    toggleIDCardImg() {
      if ($('.id-front').css('display') === 'block') {
        $('.id-front').hide();
        $('.id-back').show();
      } else {
        $('.id-front').show();
        $('.id-back').hide();
      }
    }
    // 给video标签加上双击全屏
    requestVideoFullScreen() {
      document.querySelectorAll('video').forEach(function (item) {
        $(item).unbind();
      });
      document.querySelectorAll('video').forEach(function (item) {
        $(item).on('dblclick', function () {
          console.log(`双击全屏：`, this);
          if (this.webkitRequestFullScreen) {
            this.webkitRequestFullScreen();
          } else if (this.mozRequestFullScreen) {
            this.mozRequestFullScreen();
          } else if (this.msRequestFullScreen) {
            this.msRequestFullScreen();
          }
        });
      });
    }
    // 判断当前是否在全屏状态
    isFullScreen() {
      return document.isFullScreen || document.mozIsFullScreen || document.webkitIsFullScreen;
    }
    // 获取当前正在全屏的元素
    getFullscreenElement() {
      const fullscreenEle = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
      //注意：要在用户授权全屏后才能获取全屏的元素，否则 fullscreenEle为null
      fullscreenEle !== null ? console.log('当前全屏元素：', fullscreenEle) : '';
      return fullscreenEle;
    }
    // 退出全屏
    exitFullscreen() {
      if (!this.isFullScreen()) return;
      console.log(`退出全屏`);
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExiFullscreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }
  }

  videoCall.allClass.shuangluClass = shuangluClass;
  videoCall.shuanglu = new videoCall.allClass.shuangluClass();
})(window, videoCall); // 其它

((win, videoCall, layui) => {})(window, videoCall, layui);
