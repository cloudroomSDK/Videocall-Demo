const VideoCall = {
  // 状态管理
  state: {
    is_init: false,
    server_addr: '',
    user_id: '',
    nick_name: '',
    login_type: 1,
    meet_id: '',
    session_call_id: '',
    call_user_id: '',
    call_user_que: '',
    me_user_id: '',
    que_id: '',
    meeting: false,
    reEnterTimes: 0,
    reLoginTimes: 0,
    cr_account: '默认',
    cr_psw: '默认',
    reLoginTimer: null,
    record_timer: -1,
    queue_timer: null, // 排队计时器
    useFrontVideo: true,
  },

  // 初始化
  init() {
    $('#userName').val(localStorage.getItem('cr_nickname') || '');
    const savedServerAddr = localStorage.getItem('CRServerAdd') || window.location.host;
    $('#ser_address').val(savedServerAddr.includes('127.0.0.1') || savedServerAddr.includes('localhost') ? '' : savedServerAddr);
    $('#ser_acount').val(localStorage.getItem('cr_account') || '默认');
    $('#ser_password').val(localStorage.getItem('cr_psw') || '默认');

    this.state.server_addr = sessionStorage.getItem('CRServerAdd') || window.location.host;
    this.state.cr_account = localStorage.getItem('cr_account') || '默认';
    this.state.cr_psw = localStorage.getItem('cr_psw') || '默认';
    document.querySelector('.version span').innerText = CRVideo.sdkver;
    this.bindEvents();
    this.initSDKCallbacks();

    window.onbeforeunload = () => {
      CRVideo_Logout();
      CRVideo_Uninit();
    };
  },

  // UI操作
  ui: {
    showLoading() {
      $('#loading').removeClass('hide');
    },
    hideLoading() {
      $('#loading').addClass('hide');
    },
    tipLayer(msg, timer) {
      layui.use('layer', (layer) => {
        layer.open({
          title: 0,
          btn: 0,
          content: msg,
          closeBtn: 0,
          shade: 0,
          time: timer || 2000,
        });
      });
    },
    showPage(pageName) {
      const pages = ['.login_box', '.server_set_box', '.queue_box1', '.queue_box2', '.line_up', '.dialog', '.mode_select_box', '.identity_select_box', '.direct_call_box'];
      pages.forEach((page) => {
        $(page).toggleClass('hide', page !== pageName);
      });
    },
  },

  // 事件绑定
  bindEvents() {
    // 服务器设置
    $('#server_set').on('click', () => this.ui.showPage('.server_set_box'));
    $('#close_ser_page').on('click', () => this.ui.showPage('.login_box'));
    $('#server_reset').on('click', () => this.serverSet.reset());
    $('#server_keep').on('click', () => this.serverSet.save());

    // 登录
    $('#login_btn').on('click', () => this.login.doLogin());

    // 模式选择
    $('#mode_select_close').on('click', () => this.login.doLogout());
    $('#identity_select_back, #direct_call_back').on('click', () => this.ui.showPage('.mode_select_box'));
    $('#queue_call_btn').on('click', () => this.ui.showPage('.identity_select_box'));
    $('#direct_call_btn').on('click', () => this.ui.showPage('.direct_call_box'));

    // 身份选择
    $('#identity_customer_btn').on('click', () => this.queue.showCustomerQueue());
    $('#identity_agent_btn').on('click', () => this.queue.showAgentQueue());

    // 直接呼叫
    $('#direct_call_start_btn').on('click', () => this.call.startDirectCall());

    // 会议操作
    $('#meet_colse_btn').on('click', () => this.meeting.hangup());
    $('#video_operate_btn').on('click', (e) => this.meeting.toggleVideo(e.currentTarget));
    $('#mic_operate_btn').on('click', (e) => this.meeting.toggleMic(e.currentTarget));
    $('#change_camera').on('click', (e) => this.meeting.switchCamera(e.currentTarget));
    $('#video_lower').on('click', () => this.meeting.updateVideoCfg(1));
    $('#video_normal').on('click', () => this.meeting.updateVideoCfg(2));
    $('#video_height').on('click', () => this.meeting.updateVideoCfg(3));
    $('#video_max').on('click', () => this.meeting.updateVideoCfg(4));
  },

  // 初始化SDK回调
  initSDKCallbacks() {
    // 登录
    CRVideo_LoginSuccess.callback = (u, c) => this.login.handleLoginSuccess(u, c);
    CRVideo_LoginFail.callback = (e, c) => this.login.handleLoginFail(e, c);
    CRVideo_LineOff.callback = (e) => this.login.handleLineOff(e);

    // 队列
    CRVideo_InitQueueDatRslt.callback = (code) => {
      if (code !== 0) {
        this.ui.hideLoading();
        this.ui.tipLayer('获取队列数据失败');
        this.ui.showPage('.login_box');
      }
    };
    CRVideo_StartQueuingRslt.callback = (errCode) => {
      if (errCode === 0) this.queue.popupUserQueLayer(this.state.que_id);
      else {
        this.ui.hideLoading();
        this.ui.tipLayer('排队失败');
      }
    };
    CRVideo_StopQueuingRslt.callback = () => CRVideo_GetQueueStatus(this.state.que_id);
    CRVideo_QueueStatusChanged.callback = (s) => this.queue.updateQueStatus(s);
    CRVideo_GetQueueStatusRslt.callback = (s) => this.queue.updateQueStatus(s);
    CRVideo_QueuingInfoChanged.callback = (info) => { if (info.position) $('#user_num').text(info.position - 1) };

    CRVideo_StartServiceRslt.callback = (queID, errCode) => {
      if(errCode === 0) CRVideo_GetQueueStatus(queID);
    };
    CRVideo_StopServiceRslt.callback = (queID, errCode) => {
      if(errCode === 0) CRVideo_GetQueueStatus(queID);
    };
    CRVideo_AutoAssignUser.callback = (usr) => this.queue.popupUserSrvLayer(usr);
    CRVideo_ReqAssignUserRslt.callback = (err, usr) => {
      if (err === 0) this.queue.popupUserSrvLayer(usr);
      else this.ui.tipLayer(err === 101 ? '目前没有需要服务的客户' : '未开启队列服务');
    };
    CRVideo_CancelAssignUser.callback = (queID, usrID) => {
      layui.use('layer', (layer) => layer.closeAll());
    };

    CRVideo_NotifyUserStatus.callback = (userStatus, cookie) => {};
    CRVideo_SetDNDStatusSuccess.callback = (json) => console.log('SetDNDStatusSuccess', json);
    CRVideo_SetDNDStatusFail.callback = (json) => console.log('SetDNDStatusFail', json);

    // 呼叫
    CRVideo_NotifyCallIn.callback = (c, m, u, d) => this.call.handleNotifyCallIn(c, m, u, d);
    CRVideo_CreateMeetingSuccess.callback = (meetObj) => {
      CRVideo_Call(this.state.call_user_id, meetObj);
      CRVideo_AcceptAssignUser(this.state.call_user_que, this.state.call_user_id);
    };
    CRVideo_CreateMeetingFail.callback = () => {
      this.ui.hideLoading();
      this.ui.tipLayer('创建会议失败');
    };
    CRVideo_CallSuccess.callback = (callID) => {
      CRVideo.CallID = callID;
    };
    CRVideo_CallFail.callback = () => {
      this.ui.hideLoading();
      this.ui.tipLayer('呼叫失败');
    };
    CRVideo_NotifyCallAccepted.callback = (callID, meetObj) => {
      this.state.meet_id = meetObj.ID;
      this.state.session_call_id = callID;
      CRVideo_EnterMeeting3(this.state.meet_id);
    };
    CRVideo_NotifyCallRejected.callback = () => {
      this.ui.hideLoading();
      this.ui.tipLayer('呼叫被对方拒绝');
    };

    // 会议
    CRVideo_EnterMeetingRslt.callback = (e, c) => {
      this.ui.hideLoading();
      if (e === 0) this.meeting.handleEnterMeetingSuccess(c);
      else this.meeting.handleEnterMeetingFail(e, c);
    };
    CRVideo_MeetingDropped.callback = () => this.meeting.handleMeetingDropped();
    CRVideo_UserEnterMeeting.callback = (usrID) => {
      console.log(`UserEnterMeeting: ${usrID}`);
    };
    CRVideo_UserLeftMeeting.callback = (id, reson) => {
      if (id !== this.state.me_user_id) {
        const reasonText = reson === 'extrude' ? '网络掉线...' : '已离开';
        this.ui.tipLayer(`用户 ${id} ${reasonText}`);
      }
    };
    CRVideo_NotifyCmdData.callback = (sourceUserId, data) => {
      this.ui.tipLayer(`收到${sourceUserId}的消息：${data}`);
    };
    CRVideo_HangupCallSuccess.callback = () => this.meeting.handleHangup();
    CRVideo_HangupCallFail.callback = () => this.ui.tipLayer('挂断呼叫失败！');
    CRVideo_NotifyCallHungup.callback = () => {
      this.meeting.handleHangup();
      this.ui.tipLayer('当前呼叫已被挂断');
    };
    CRVideo_OpenVideoFailed.callback = (c, d) => this.ui.tipLayer(`打开摄像头失败：${d}`);
    CRVideo_OpenMicFailed.callback = (c, d) => this.ui.tipLayer(`打开麦克风失败：${d}`);
    CRVideo_VideoStatusChanged.callback = (userID, oldStatus, newStatus) => {};
    CRVideo_DefVideoChanged.callback = (userID, videoID) => {};
    CRVideo_VideoDevChanged.callback = (userID) => {};
  },

  // 服务器设置模块
  serverSet: {
    initPage() {
      $('#ser_acount').val(VideoCall.state.cr_account);
      $('#ser_password').val(VideoCall.state.cr_psw);
    },
    reset() {
      const host = window.location.host;
      $('#ser_address').val(host);
      sessionStorage.setItem('CRServerAdd', host);
      $('#ser_acount').val('默认');
      $('#ser_password').val('默认');
    },
    save() {
      VideoCall.state.server_addr = $('#ser_address').val();
      VideoCall.state.cr_account = $('#ser_acount').val();
      VideoCall.state.cr_psw = $('#ser_password').val();
      localStorage.setItem('CRServerAdd', VideoCall.state.server_addr);
      localStorage.setItem('cr_account', VideoCall.state.cr_account);
      localStorage.setItem('cr_psw', VideoCall.state.cr_psw);
      VideoCall.ui.showPage('.login_box');
    },
  },

  // 登录模块
  login: {
    doLogin() {
      const nickName = $('#userName').val();
      if (nickName === '') {
        VideoCall.ui.tipLayer('请输入昵称');
        return;
      }
      if (nickName.length > 10) {
        VideoCall.ui.tipLayer('用户昵称过长,请修改后重试');
        return;
      }
      VideoCall.state.nick_name = nickName;

      VideoCall.state.server_addr = $('#ser_address').val();
      VideoCall.state.cr_account = $('#ser_acount').val();
      VideoCall.state.cr_psw = $('#ser_password').val();
      localStorage.setItem('cr_nickname', VideoCall.state.nick_name);
      localStorage.setItem('CRServerAdd', VideoCall.state.server_addr);
      localStorage.setItem('cr_account', VideoCall.state.cr_account);
      localStorage.setItem('cr_psw', VideoCall.state.cr_psw);

      CRVideo_Init().then(
        () => {
          CRVideo_SetSDKParams({});
          VideoCall.state.is_init = true;
          VideoCall.state.user_id = VideoCall.state.nick_name;
          const { cr_psw, cr_account, nick_name, user_id, server_addr } = VideoCall.state;
          const pswMd5 = cr_psw === '默认' ? '默认' : md5(cr_psw);
          CRVideo_SetServerAddr(server_addr);
          CRVideo_Login(cr_account, pswMd5, nick_name, user_id, '');
          VideoCall.ui.showLoading();
        },
        (err) => {
          VideoCall.ui.tipLayer(`初始化失败：${err}`);
        }
      );
    },
    doLogout() {
      CRVideo_Logout();
      setTimeout(() => location.replace(location.href), 200);
    },
    handleLoginSuccess(usrID, cookie) {
      VideoCall.state.reLoginTimes = 0;
      console.log(`CRVideo_LoginSuccess(usrID:${usrID})`);
      VideoCall.ui.hideLoading();
      VideoCall.state.me_user_id = VideoCall.state.user_id;

      if (cookie && cookie.includes('reLogin')) return;

      if (!VideoCall.state.meeting) {
        CRVideo_InitQueueDat();
        VideoCall.ui.showPage('.mode_select_box');
        $('#my_id_display_2').text(VideoCall.state.me_user_id);
      }
    },
    handleLoginFail(sdkErr, cookie) {
      VideoCall.ui.hideLoading();
      console.log(`登录服务器失败，错误码：${sdkErr}, cookie:${cookie}`);
      const reLoginMatch = cookie && cookie.includes('reLogin') && cookie.split('_');
      if (reLoginMatch && reLoginMatch[1] <= 10) {
        setTimeout(() => {
          const { cr_account, cr_psw, nick_name, user_id } = VideoCall.state;
          const pswMd5 = cr_psw === '默认' ? '默认' : md5(cr_psw);
          CRVideo_Login(cr_account, pswMd5, nick_name, user_id, '', `reLogin_${++VideoCall.state.reLoginTimes}`);
        }, 2000);
      } else if (reLoginMatch && reLoginMatch[1] > 10) {
        VideoCall.ui.tipLayer('网络错误，多次尝试重新登录失败！您已掉线！');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        VideoCall.state.is_init = false;
        const errMap = { 7: '用户名或密码错误！', 18: 'Token已过期！', 20: '鉴权app不存在！', 21: 'Token鉴权失败！', 22: '此app非Token鉴权！', 202: '网络异常！', 204: 'socket连接失败！' };
        VideoCall.ui.tipLayer(`登录服务器失败: ${errMap[sdkErr] || sdkErr}`);
      }
    },
    handleLineOff(sdkErr) {
      console.log(`系统掉线了... ${sdkErr}`);
      if (sdkErr === 10) {
        if (VideoCall.state.meeting) {
          CRVideo_ExitMeeting('kick');
        }
        VideoCall.ui.showPage('.login_box');
        setTimeout(() => VideoCall.ui.tipLayer('您被别人踢下线了...'), 1000);
      } else if (sdkErr !== 18) {
        !VideoCall.state.meeting && VideoCall.ui.tipLayer('登录掉线，正在重新登录');
        clearTimeout(VideoCall.state.reLoginTimer);
        VideoCall.state.reLoginTimer = setTimeout(() => {
          console.log('重新登录...');
          const { cr_account, cr_psw, nick_name, user_id } = VideoCall.state;
          const pswMd5 = cr_psw === '默认' ? '默认' : md5(cr_psw);
          CRVideo_Login(cr_account, pswMd5, nick_name, user_id, '', `reLogin_${++VideoCall.state.reLoginTimes}`);
        }, 3000);
      }
    },
  },

  // 队列模块
  queue: {
    showCustomerQueue() {
      VideoCall.state.login_type = 1;
      VideoCall.ui.showPage('.queue_box1');
      $('#queue_box1_close')
        .off('click')
        .on('click', () => VideoCall.login.doLogout());

      const que_info = CRVideo_GetAllQueueInfo();
      if (!que_info) return;

      let li = '';
      que_info.forEach((item) => {
        item.desc = item.desc ? `备注：${item.desc}` : '';
        li += `<li id="queue_li_${item.queID}" queID="${item.queID}"><p class="p1"><span class="queue_name" id="queue_name_${item.queID}">${item.name}</span><span id="span_li_${item.queID}">（0人等待）</span></p><p class="p2">${item.desc}</p></li>`;
      });

      $('#queueList1')
        .html(li)
        .find('li')
        .on('click', (e) => {
          VideoCall.ui.showLoading();
          const queID = Number($(e.currentTarget).attr('queID'));
          if (VideoCall.queue.isQueuingById(queID)) {
            CRVideo_StopQueuing();
          }
          setTimeout(() => {
            CRVideo_StartQueuing(queID);
            VideoCall.state.que_id = queID;
          }, 200);
        });
      CRVideo_RefreshAllQueueStatus();
    },
    showAgentQueue() {
      VideoCall.state.login_type = 2;
      VideoCall.ui.showPage('.queue_box2');

      const que_info = CRVideo_GetAllQueueInfo();
      if (!que_info) return;

      let li = '';
      que_info.forEach((item) => {
        const btn_text = VideoCall.queue.isServicedById(item.queID) ? '正在服务.....' : '未服务';
        li += `<li id="queue_li_${item.queID}" queID="${item.queID}"><p class="p1">窗口名称：${item.name}</p><p class="p2"><span>坐席人数：<span id="span_en_${item.queID}">0</span></span><span>排队人数：<span id="span_qn_${item.queID}">0</span></span><span>会话中人数：<span id="span_sn_${item.queID}">0</span></span></p><span class="queue_state" id="srv_open_btn_${item.queID}">${btn_text}</span></li>`;
      });

      $('#queueList2')
        .html(li)
        .find('li')
        .on('click', (e) => {
          const queID = +$(e.currentTarget).attr('queID');
          const $state = $(e.currentTarget).find('.queue_state');
          if (VideoCall.queue.isServicedById(queID)) {
            CRVideo_StopService(queID);
            $state.text('未服务');
          } else {
            CRVideo_StartService(queID);
            $state.text('正在服务.....');
          }
        });

      VideoCall.queue.setSrvDNDState(false);
      $('#system_auto').addClass('check');
      $('#next_user')
        .off('click')
        .on('click', () => CRVideo_ReqAssignUser());
      $('#system_auto')
        .off('click')
        .on('click', (e) => {
          const isChecked = $(e.currentTarget).toggleClass('check').hasClass('check');
          VideoCall.queue.setSrvDNDState(!isChecked);
        });
      $('#queue_box2_close')
        .off('click')
        .on('click', () => VideoCall.login.doLogout());
      CRVideo_RefreshAllQueueStatus();
    },
    isServicedById(queID) {
      return CRVideo_GetServingQueues().includes(queID);
    },
    isQueuingById(queID) {
      const info = CRVideo_GetQueuingInfo();
      return info.queID && info.queID == queID;
    },
    setSrvDNDState(state) {
      $('#next_user').toggleClass('hide', !state);
      CRVideo_SetDNDStatus(state ? 1 : 0);
    },
    updateQueStatus(status) {
      const { queID, agent_num, wait_num, srv_num } = status;
      if (VideoCall.state.login_type == 2) {
        $(`#span_en_${queID}`).text(agent_num);
        $(`#span_qn_${queID}`).text(wait_num);
        $(`#span_sn_${queID}`).text(srv_num);
      } else {
        $(`#span_li_${queID}`).text(`（${wait_num}人等待）`);
      }
    },
    popupUserQueLayer(queID) {
      const queName = $(`#queue_name_${queID}`).text();
      VideoCall.ui.hideLoading();
      $('#user_position').hide();
      VideoCall.ui.showPage('.line_up');
      $('#queue_name').text(queName);
      $('#line_up_time').text('0秒');

      let startTime = 0;
      if (VideoCall.state.queue_timer) clearInterval(VideoCall.state.queue_timer);
      VideoCall.state.queue_timer = setInterval(() => {
        startTime++;
        const min = parseInt(startTime / 60);
        const s = startTime % 60;
        $('#line_up_time').text(min > 0 ? `${min}分${s}秒` : `${s}秒`);
      }, 1000);

      $('.line_up_btn').off('click').on('click', () => {
        clearInterval(VideoCall.state.queue_timer);
        VideoCall.state.queue_timer = null;
        CRVideo_StopQueuing();
        VideoCall.ui.showPage('.queue_box1');
      });
    },
    popupUserSrvLayer(user) {
      layui.use('layer', (layer) => {
        layer.open({
          type: 0,
          area: '400px',
          title: ['用户分配中', 'font-size:14px;'],
          content: `系统为您分配【${user.userID}】`,
          btn: ['<p style="font-size:14px;">确定</p>', '<p style="font-size:14px;">取消</p>'],
          yes: (index) => {
            layer.close(index);
            VideoCall.state.call_user_id = user.userID;
            VideoCall.state.call_user_que = user.queID;
            CRVideo_CreateMeeting2();
            VideoCall.ui.showLoading();
          },
          btn2: (index) => {
            layer.close(index);
            CRVideo_RejectAssignUser(user.queID, user.userID);
          },
        });
      });
    }
  },

  // 呼叫模块
  call: {
    startDirectCall() {
      const peerId = $('#peer_id_input').val();
      if (!peerId) {
        VideoCall.ui.tipLayer('请输入对方ID');
        return;
      }
      VideoCall.state.call_user_id = peerId;
      VideoCall.state.login_type = 2;
      CRVideo_CreateMeeting2();
      VideoCall.ui.showLoading();
    },
    handleNotifyCallIn(callID, meetObj, callerID) {
      // 如果正在排队，则停止计时
      if (!$('.line_up').hasClass('hide') && VideoCall.state.queue_timer) {
        clearInterval(VideoCall.state.queue_timer);
        VideoCall.state.queue_timer = null;
      }

      if (!$('.direct_call_box').hasClass('hide')) {
        VideoCall.state.login_type = 1;
      }
      CRVideo_AcceptCall(callID, meetObj);
      VideoCall.state.meet_id = meetObj.ID;
      VideoCall.state.session_call_id = callID;
      VideoCall.state.call_user_id = callerID;
      CRVideo_EnterMeeting3(meetObj.ID);
    },
  },

  // 会议模块
  meeting: {
    hangup() {
      CRVideo_HungupCall(VideoCall.state.session_call_id);
      VideoCall.ui.showPage('.mode_select_box');
    },
    toggleVideo(btn) {
      const $btn = $(btn);
      if ($btn.hasClass('disabled')) return;
      $btn.addClass('disabled');
      setTimeout(() => $btn.removeClass('disabled'), 2000);

      const vStatus = CRVideo_GetVideoStatus(VideoCall.state.me_user_id);
      if (vStatus === 0) {
        VideoCall.ui.tipLayer('没有可打开的视频设备');
      } else if (vStatus === 2) {
        CRVideo_OpenVideo(VideoCall.state.me_user_id);
        $btn.text('关闭摄像头');
      } else {
        CRVideo_CloseVideo(VideoCall.state.me_user_id);
        $btn.text('打开摄像头');
      }
    },
    toggleMic(btn) {
      const $btn = $(btn);
      if ($btn.hasClass('disabled')) return;
      $btn.addClass('disabled');
      setTimeout(() => $btn.removeClass('disabled'), 2000);

      const aStatus = CRVideo_GetAudioStatus(VideoCall.state.me_user_id);
      if (aStatus === 0) {
        VideoCall.ui.tipLayer('没有可打开的音频设备');
      } else if (aStatus === 2) {
        CRVideo_OpenMic(VideoCall.state.me_user_id);
        $btn.text('关闭麦克风');
      } else {
        CRVideo_CloseMic(VideoCall.state.me_user_id);
        $btn.text('打开麦克风');
      }
    },
    switchCamera(btn) {
      const $btn = $(btn);
      if ($btn.hasClass('disabled')) return;
      $btn.addClass('disabled');
      setTimeout(() => $btn.removeClass('disabled'), 2000);

      const videoList = CRVideo_GetAllVideoInfo(VideoCall.state.me_user_id);
      if (videoList.length > 1) {
        VideoCall.state.useFrontVideo = !VideoCall.state.useFrontVideo;
        CRVideo_SetDefaultVideo(VideoCall.state.me_user_id, VideoCall.state.useFrontVideo ? 1 : 2);
      } else {
        VideoCall.ui.tipLayer('摄像头还没准备好，请稍后');
      }
    },
    updateVideoCfg(num) {
      CRVideo_SetVideoCfg({ size: num });
    },
    dialogTimeCounter() {
      let startTime = 0;
      if (VideoCall.state.record_timer != -1) {
        clearInterval(VideoCall.state.record_timer);
      }
      VideoCall.state.record_timer = setInterval(() => {
        startTime++;
        const min = parseInt(startTime / 60);
        const s = startTime % 60;
        $('#video_time').text(min > 0 ? `${min}分${s}秒` : `${s}秒`);
      }, 1000);
    },
    handleEnterMeetingSuccess(cookie) {
      VideoCall.state.meeting = true;
      VideoCall.state.reEnterTimes = 0;
      if (cookie && cookie.includes('reEnter')) {
        VideoCall.ui.tipLayer('进入房间成功');
      }

      // 清理排队时间
      $('#line_up_time').text('0秒');
      VideoCall.ui.showPage('.dialog');

      const videoOptions = { poster: './image/be_closed.jpg', style: { objectFit: 'contain' } };
      const others_video = CRVideo_CreatVideoObj(videoOptions);
      const my_video = CRVideo_CreatVideoObj(videoOptions);
      others_video.dblClickFullScreen(true);
      my_video.dblClickFullScreen(true);

      $('#video_main').html(others_video.handler());
      $('#video_local').html(my_video.handler());

      $('#mic_operate_btn').text('关闭麦克风');
      $('#video_operate_btn').text('关闭摄像头');

      $('#call_user_name').text(VideoCall.state.call_user_id);
      VideoCall.meeting.dialogTimeCounter();

      my_video.setVideo(VideoCall.state.me_user_id);
      others_video.setVideo(VideoCall.state.call_user_id);

      CRVideo_OpenVideo(VideoCall.state.me_user_id);
      CRVideo_OpenMic(VideoCall.state.me_user_id);
    },
    handleEnterMeetingFail(sdkErr, cookie) {
      VideoCall.ui.hideLoading();
      const reEnterMatch = cookie && cookie.includes('reEnter') && cookie.split('_');
      if (reEnterMatch && reEnterMatch[1] <= 10) {
        setTimeout(() => {
          VideoCall.ui.tipLayer(`进入房间失败，第${VideoCall.state.reEnterTimes + 1}次尝试...`);
          const { meet_id, user_id, nick_name } = VideoCall.state;
          CRVideo_EnterMeeting(meet_id, '', user_id, nick_name, `reEnter_${++VideoCall.state.reEnterTimes}`);
        }, 2000);
      } else {
        VideoCall.state.meeting = false;
        const errMap = { 205: '没有可用服务器', 800: '房间不存在或已结束', 802: '服务器授权到期或超出并发数！' };
        VideoCall.ui.tipLayer(`进入房间失败！${errMap[sdkErr] || '请稍后再试！'}`);
      }
    },
    handleMeetingDropped() {
      VideoCall.state.meeting = false;
      VideoCall.ui.tipLayer('已从房间中掉线，准备重新进入...');
      setTimeout(() => {
        VideoCall.ui.tipLayer('正在第1次尝试重新进入房间...');
        const { meet_id, user_id, nick_name } = VideoCall.state;
        CRVideo_EnterMeeting(meet_id, '', user_id, nick_name, `reEnter_${++VideoCall.state.reEnterTimes}`);
      }, 3000);
    },
    handleHangup() {
      // 如果是坐席，挂断后停止所有服务
      if (VideoCall.state.login_type === 2) {
          const servingQues = CRVideo_GetServingQueues();
          servingQues.forEach(queID => CRVideo_StopService(queID));
      }

      CRVideo_ExitMeeting();
      if (VideoCall.state.record_timer != -1) {
        clearInterval(VideoCall.state.record_timer);
      }
      VideoCall.state.meeting = false;
      VideoCall.state.session_call_id = null;
      VideoCall.state.useFrontVideo = true;
      VideoCall.ui.showPage('.mode_select_box');
    },
  },
};
