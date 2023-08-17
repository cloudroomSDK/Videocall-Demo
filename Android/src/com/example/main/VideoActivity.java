package com.example.main;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.graphics.Rect;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Handler.Callback;
import android.os.Message;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.cloudroom.cloudroomvideosdk.CRMeetingCallback;
import com.cloudroom.cloudroomvideosdk.CRMgrCallback;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMeeting;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMgr;
import com.cloudroom.cloudroomvideosdk.VideoUIView;
import com.cloudroom.cloudroomvideosdk.model.ASTATUS;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_ERR_DEF;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_MEETING_DROPPED_REASON;
import com.cloudroom.cloudroomvideosdk.model.MIXER_STATE;
import com.cloudroom.cloudroomvideosdk.model.MemberInfo;
import com.cloudroom.cloudroomvideosdk.model.Size;
import com.cloudroom.cloudroomvideosdk.model.UsrVideoId;
import com.cloudroom.cloudroomvideosdk.model.UsrVideoInfo;
import com.cloudroom.cloudroomvideosdk.model.VSTATUS;
import com.cloudroom.cloudroomvideosdk.model.VideoCfg;
import com.example.videocalldemo.R;
import com.examples.common.MixerContentHelper;
import com.examples.common.VideoSDKHelper;
import com.examples.tool.CRLog;
import com.examples.tool.Tools;
import com.examples.tool.UITool;
import com.examples.tool.UITool.ConfirmDialogCallback;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

@SuppressLint({ "NewApi", "HandlerLeak", "ClickableViewAccessibility",
		"DefaultLocale", "SimpleDateFormat" })
/**
 * 视频界面
 * @author lake
 *
 */
public class VideoActivity extends BaseActivity implements OnTouchListener,
		Callback {

	private static final String TAG = "VideoActivity";

	public static String mPeerUserId = "";

	private VideoSettingDialog mSettingDialog = null;
	private VideoUIView mPeerGLSV = null;
	private VideoUIView mSelfGLSV = null;

	private TextView mPromptTV = null;

	private Button mCameraSwitchBtn = null;
	private Button mCameraBtn = null;
	private Button mMicBtn = null;

	private Button mStartSvrBtn = null;
	private Button mStopSvrBtn = null;

	private ProgressBar mMicPB = null;
	private View mOPtionsView = null;

	private String mMixerID = null;

	private final static int MSG_UPDATE_TIME = 10000;
	private static final int MSG_HIDE_OPTION = 10002;

	@Override
	public boolean handleMessage(Message msg) {

		switch (msg.what) {
		case MSG_UPDATE_TIME:
			updatePromptInfo();
			break;
		case MSG_HIDE_OPTION:
			hideOptionBar();
			break;
		default:
			break;
		}
		return false;
	}

	public Handler mMainHandler = new Handler(this);

	private CRMeetingCallback mMeetingCallback = new CRMeetingCallback() {

		@SuppressWarnings("deprecation")
		@Override
		public void enterMeetingRslt(CRVIDEOSDK_ERR_DEF code) {

			UITool.hideProcessDialog(VideoActivity.this);
			if (code != CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR) {
				VideoSDKHelper.getInstance().showToast(R.string.enter_fail,
						code);
				CloudroomVideoMgr.getInstance().hangupCall(
						VideoSDKHelper.getInstance().getCallId(), TAG);
				exitVideoCall();
				return;
			}

			// SDK语音使用STREAM_VOICE_CALL语音流，设置当前界面控制
			setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);

			// 监听耳机插拔
			watchHeadset();
			VideoSDKHelper.getInstance().showToast(R.string.enter_success);

			updateCameraBtn();
			updatePromptInfo();
			updateMicBtn();

			if (VideoSDKHelper.getInstance().bServer()) {
				String allMixerInfo = CloudroomVideoMeeting.getInstance()
						.getAllCloudMixerInfo();
				JsonArray mixerList = new JsonParser().parse(allMixerInfo).getAsJsonArray();
				boolean hasMixer = mixerList.size() > 0;
				mStartSvrBtn
						.setVisibility(hasMixer ? View.GONE
								: View.VISIBLE);
				mStopSvrBtn
						.setVisibility(hasMixer ? View.VISIBLE
								: View.GONE);
			}

			// 默认使用前置摄像头
			String myUserID = CloudroomVideoMeeting.getInstance().getMyUserID();
			ArrayList<UsrVideoInfo> myVideos = CloudroomVideoMeeting
					.getInstance().getAllVideoInfo(myUserID);
			for (UsrVideoInfo vInfo : myVideos) {
				if (vInfo.videoName.contains("FRONT")) {
					CloudroomVideoMeeting.getInstance().setDefaultVideo(
							myUserID, vInfo.videoID);
					break;
				}
			}

			// 登录成功打开麦克风
			CloudroomVideoMeeting.getInstance().openMic(myUserID);
			// 登录成功打开摄像头
			CloudroomVideoMeeting.getInstance().openVideo(myUserID);

			VideoCfg cfg = mSettingDialog.getVideoCfg();
			CloudroomVideoMeeting.getInstance().setVideoCfg(cfg);

			// 如果没接耳机，开启外放
			AudioManager audioMgr = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
			CloudroomVideoMeeting.getInstance().setSpeakerOut(
					!audioMgr.isWiredHeadsetOn());

			hideOptionBar();
		}

		@Override
		public void meetingDropped(CRVIDEOSDK_MEETING_DROPPED_REASON reason) {
			VideoSDKHelper.getInstance().showToast(R.string.sys_dropped);
			exitVideoCall();
		}

		@Override
		public void meetingStopped() {

			VideoSDKHelper.getInstance().showToast(R.string.meet_stopped);
			exitVideoCall();
		}

		@Override
		public void micEnergyUpdate(String userID, int oldLevel, int newLevel) {

			String myUserID = CloudroomVideoMeeting.getInstance().getMyUserID();
			if (myUserID.equals(userID)) {
				mMicPB.setProgress(newLevel % mMicPB.getMax());
			}
		}

		@Override
		public void audioDevChanged() {

			super.audioDevChanged();
		}

		@Override
		public void audioStatusChanged(String userID, ASTATUS oldStatus,
				ASTATUS newStatus) {

			updateMicBtn();
		}

		@Override
		public void defVideoChanged(String userID, short videoID) {

//			String myUserId = CloudroomVideoMeeting.getInstance().getMyUserID();
//			if (userID != null
//					&& (userID.equals(mPeerUserId) || userID.equals(myUserId))) {
//				// 更新观看视频
//				updateWatchVideos();
//				updateSvrRecContents();
//			}
		}

		@Override
		public void openVideoRslt(String devID, boolean bSuccess) {
			super.openVideoRslt(devID, bSuccess);
		}

		@Override
		public void userEnterMeeting(String userID) {
			// 更新观看视频
			updateWatchVideos();
			// 更新标题提示
			updatePromptInfo();
		}

		@Override
		public void userLeftMeeting(String userID) {
			// 第一方坐席离开，设置第三方坐席为第一方坐席
			String myUserid = CloudroomVideoMeeting.getInstance().getMyUserID();
			if (userID.equals(mPeerUserId)) {
				ArrayList<MemberInfo> mems = CloudroomVideoMeeting
						.getInstance().getAllMembers();
				for (MemberInfo mem : mems) {
					if (!myUserid.equals(mem.userId)) {
						mPeerUserId = mem.userId;
					}
				}
			}

			// 更新观看视频
			updateWatchVideos();
			// 更新标题提示
			updatePromptInfo();
		}

		@Override
		public void videoDevChanged(String userID) {
			updateCameraSwitchBtn();
		}

		@Override
		public void videoStatusChanged(String userID, VSTATUS oldStatus,
				VSTATUS newStatus) {
			updateCameraBtn();

			String myUserId = CloudroomVideoMeeting.getInstance().getMyUserID();
			if (userID != null
					&& (userID.equals(mPeerUserId) || userID.equals(myUserId))) {
				// 更新观看视频
				updateWatchVideos();
				updateSvrRecContents();
			}
		}

		@Override
		public void createCloudMixerFailed(String mixerID, CRVIDEOSDK_ERR_DEF err) {
			Log.d(TAG, "createCloudMixerFailed mixerID:" + mixerID + " err:" + err);
		}

		@Override
		public void cloudMixerStateChanged(String operatorID, String mixerID, MIXER_STATE state, String exParam) {
			if (!VideoSDKHelper.getInstance().bServer()) {
				return;
			}
			Log.d(TAG, "cloudMixerStateChanged mixerID:" + mixerID + " state:" + state);
			boolean recording = state != MIXER_STATE.MIXER_NULL;
			mStartSvrBtn.setVisibility(recording ? View.GONE : View.VISIBLE);
			mStopSvrBtn.setVisibility(recording ? View.VISIBLE : View.GONE);
			if (state == MIXER_STATE.MIXER_NULL
					|| state == MIXER_STATE.MIXER_RUNNING) {
				UITool.hideProcessDialog(VideoActivity.this);
			}
		}

		@Override
		public void cloudMixerInfoChanged(String mixerID) {
			Log.d(TAG, "cloudMixerInfoChanged mixerID:" + mixerID);
		}

		@Override
		public void cloudMixerOutputInfoChanged(String mixerID, String jsonStr) {
			Log.d(TAG, "cloudMixerOutputInfoChanged mixerID:" + mixerID);
		}

	};

	private CRMgrCallback mMgrCallback = new CRMgrCallback() {

		@Override
		public void lineOff(CRVIDEOSDK_ERR_DEF sdkErr) {
			VideoSDKHelper.getInstance().showToast(R.string.sys_dropped);
			exitVideoCall();
		}

		@Override
		public void hangupCallSuccess(String callID, String cookie) {
			exitVideoCall();
		}

		@Override
		public void notifyCallHungup(String callID, final String useExtDat) {
			UITool.showMessageDialog(VideoActivity.this,
					getString(R.string.call_hanguped),
					new ConfirmDialogCallback() {

						@Override
						public void onOk() {
							exitVideoCall();
						}

						@Override
						public void onCancel() {
							exitVideoCall();
						}
					});
		}
	};

	/**
	 * 退出会话
	 */
	private void exitVideoCall() {
		String info = CloudroomVideoMeeting.getInstance().getAllCloudMixerInfo();
		if (!TextUtils.isEmpty(info)) {
			stopSvrRecord();
		}

		CloudroomVideoMeeting.getInstance()
				.unregisterCallback(mMeetingCallback);
		CloudroomVideoMgr.getInstance().unregisterCallback(mMgrCallback);
		finish();
		CloudroomVideoMeeting.getInstance().exitMeeting();
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		this.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
				WindowManager.LayoutParams.FLAG_FULLSCREEN);
		getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
		setContentView(R.layout.activity_video);

		mSettingDialog = new VideoSettingDialog(this);

		mPeerGLSV = (VideoUIView) findViewById(R.id.yuv_peer);
		mSelfGLSV = (VideoUIView) findViewById(R.id.yuv_self);

		mSelfGLSV.setOnTouchListener(mTouchListener);

		mPromptTV = (TextView) findViewById(R.id.tv_prompt);

		mOPtionsView = findViewById(R.id.view_options);

		mCameraSwitchBtn = (Button) findViewById(R.id.btn_switchcamera);
		mCameraBtn = (Button) findViewById(R.id.btn_camera);

		mMicBtn = (Button) findViewById(R.id.btn_mic);
		mMicPB = (ProgressBar) findViewById(R.id.pb_mic);

		mStartSvrBtn = (Button) findViewById(R.id.btn_start_svrrecord);
		mStopSvrBtn = (Button) findViewById(R.id.btn_stop_svrrecord);

		mStartSvrBtn
				.setVisibility(VideoSDKHelper.getInstance().bServer() ? View.VISIBLE
						: View.GONE);
		mStopSvrBtn.setVisibility(View.GONE);

		// 显示视频需要启用hardwareAccelerated，某些设备会导致控件花屏，需要把不需要使用硬件加速的控件关闭硬件加速功能
		mOPtionsView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
		mPromptTV.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

		CloudroomVideoMeeting.getInstance().registerCallback(mMeetingCallback);
		CloudroomVideoMgr.getInstance().registerCallback(mMgrCallback);

		updateCameraBtn();
		updatePromptInfo();
		updateMicBtn();

		int meetID = getIntent().getIntExtra("meetID", 0);
		if (meetID > 0) {
			CloudroomVideoMeeting.getInstance().enterMeeting(meetID);
			mMainHandler.post(new Runnable() {

				@Override
				public void run() {
					showEntering();
				}
			});
		}

		setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);
		View view = getWindow().getDecorView();
		view.setOnTouchListener(this);
	}

	private void showEntering() {
		UITool.showProcessDialog(this, getString(R.string.entering));
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		CloudroomVideoMeeting.getInstance()
				.unregisterCallback(mMeetingCallback);
		CloudroomVideoMgr.getInstance().unregisterCallback(mMgrCallback);
		unwatchHeadset();
		CloudroomVideoMeeting.getInstance().exitMeeting();
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {

		if (keyCode == KeyEvent.KEYCODE_BACK) {
			return true;
		}
		return super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onKeyUp(int keyCode, KeyEvent event) {

		if (keyCode == KeyEvent.KEYCODE_BACK) {
			return true;
		}
		return super.onKeyUp(keyCode, event);
	}

	private void updateWatchVideos() {
		// 更新观看视频
		ArrayList<UsrVideoId> videos = CloudroomVideoMeeting.getInstance()
				.getWatchableVideos();
		String myUserId = CloudroomVideoMeeting.getInstance().getMyUserID();

		UsrVideoId[] wVideos = { null, null };
		for (UsrVideoId usrVideoId : videos) {
			if (usrVideoId.userId.equals(myUserId)) {
				wVideos[0] = new UsrVideoId(usrVideoId.userId, (short) -1);
			} else if (wVideos[1] == null) {
				wVideos[1] = new UsrVideoId(usrVideoId.userId, (short) -1);
			}
		}
		mSelfGLSV.setUsrVideoId(wVideos[0]);
		mPeerGLSV.setUsrVideoId(wVideos[1]);
	}

	/**
	 * 更新摄像头按钮
	 */
	private void updateCameraBtn() {
		String userId = CloudroomVideoMeeting.getInstance().getMyUserID();
		VSTATUS status = CloudroomVideoMeeting.getInstance().getVideoStatus(
				userId);
		if (status == VSTATUS.VOPEN || status == VSTATUS.VOPENING) {
			mCameraBtn.setText(R.string.close_camera);
		} else {
			mCameraBtn.setText(R.string.open_camera);
		}
		updateCameraSwitchBtn();
	}

	/**
	 * 更新麦克风按钮
	 */
	private void updateMicBtn() {
		String userId = CloudroomVideoMeeting.getInstance().getMyUserID();
		ASTATUS status = CloudroomVideoMeeting.getInstance().getAudioStatus(
				userId);
		if (status == ASTATUS.AOPEN || status == ASTATUS.AOPENING) {
			mMicBtn.setText(R.string.close_mic);
		} else {
			mMicBtn.setText(R.string.open_mic);
		}
		boolean showMicPB = status == ASTATUS.AOPEN
				|| status == ASTATUS.AOPENING;
		mMicPB.setVisibility(showMicPB ? View.VISIBLE : View.GONE);
	}

	/**
	 * 更新切换摄像头按钮
	 */
	private void updateCameraSwitchBtn() {
		String userId = CloudroomVideoMeeting.getInstance().getMyUserID();
		ArrayList<UsrVideoInfo> videoInfos = CloudroomVideoMeeting
				.getInstance().getAllVideoInfo(userId);
		VSTATUS status = CloudroomVideoMeeting.getInstance().getVideoStatus(
				userId);
		// 摄像头个数大于1并且打开了摄像头，才显示切换按钮
		boolean showSwitch = status == VSTATUS.VOPEN
				|| status == VSTATUS.VOPENING && videoInfos.size() > 1;
		mCameraSwitchBtn.setVisibility(showSwitch ? View.VISIBLE : View.GONE);
	}

	/**
	 * 更新提示信息
	 */
	private void updatePromptInfo() {
		mMainHandler.removeMessages(MSG_UPDATE_TIME);
		mMainHandler.sendEmptyMessageDelayed(MSG_UPDATE_TIME, 1000);
		String text = getString(R.string.meeting_prompt1, mPeerUserId);
		long enterTime = VideoSDKHelper.getInstance().getEnterTime();
		if (enterTime > 0 && enterTime < System.currentTimeMillis()) {
			int sec = (int) (System.currentTimeMillis() - enterTime) / 1000;
			text += getString(R.string.meeting_prompt2, Tools.getTimeStr(sec));
		}
		mPromptTV.setText(text);
	}

	public void onViewClick(View v) {
		switch (v.getId()) {
		case R.id.btn_hangup:
			String callID = VideoSDKHelper.getInstance().getCallId();
			if (!TextUtils.isEmpty(callID)) {
				CloudroomVideoMgr.getInstance().hangupCall(callID, TAG);
			}
			exitVideoCall();
			break;
		case R.id.btn_mic: {
			String userId = CloudroomVideoMeeting.getInstance().getMyUserID();
			ASTATUS status = CloudroomVideoMeeting.getInstance()
					.getAudioStatus(userId);
			if (status == ASTATUS.AOPEN || status == ASTATUS.AOPENING) {
				CloudroomVideoMeeting.getInstance().closeMic(userId);
			} else {
				CloudroomVideoMeeting.getInstance().openMic(userId);
			}
			break;
		}
		case R.id.btn_camera: {
			String userId = CloudroomVideoMeeting.getInstance().getMyUserID();
			VSTATUS status = CloudroomVideoMeeting.getInstance()
					.getVideoStatus(userId);
			if (status == VSTATUS.VOPEN || status == VSTATUS.VOPENING) {
				CloudroomVideoMeeting.getInstance().closeVideo(userId);
			} else {
				CloudroomVideoMeeting.getInstance().openVideo(userId);
			}
			break;
		}
		case R.id.btn_switchcamera:
			// 切换摄像头
			switchCamera();
			break;
		case R.id.btn_setting:
			mSettingDialog.show();
			break;
		case R.id.btn_start_svrrecord:
			startSvrRecord();
			break;
		case R.id.btn_stop_svrrecord:
			stopSvrRecord();
			UITool.showProcessDialog(this,
					getString(R.string.stoping_svrrecord));
			break;
		default:
			break;
		}
	}

	/**
	 * 切换摄像头
	 */
	private void switchCamera() {
		String userId = CloudroomVideoMeeting.getInstance().getMyUserID();
		short curDev = CloudroomVideoMeeting.getInstance().getDefaultVideo(
				userId);
		ArrayList<UsrVideoInfo> devs = CloudroomVideoMeeting.getInstance()
				.getAllVideoInfo(userId);

		if (devs.size() > 1) {
			UsrVideoInfo info = devs.get(0);
			boolean find = false;
			for (UsrVideoInfo dev : devs) {
				if (find) {
					info = dev;
					break;
				} else if (dev.videoID == curDev) {
					find = true;
				}
			}
			CloudroomVideoMeeting.getInstance().setDefaultVideo(info.userId,
					info.videoID);
		}
	}

	private HeadsetReceiver mHeadsetReceiver = null;

	/**
	 * 监听耳机插拔
	 */
	private void watchHeadset() {
		if (mHeadsetReceiver != null) {
			return;
		}
		mHeadsetReceiver = new HeadsetReceiver();
		IntentFilter filter = new IntentFilter();
		filter.addAction(Intent.ACTION_HEADSET_PLUG);
		registerReceiver(mHeadsetReceiver, filter);
	}

	/**
	 * 不监听耳机插拔
	 */
	private void unwatchHeadset() {
		if (mHeadsetReceiver == null) {
			return;
		}
		unregisterReceiver(mHeadsetReceiver);
		mHeadsetReceiver = null;
	}

	private class HeadsetReceiver extends BroadcastReceiver {

		@Override
		public void onReceive(Context context, Intent intent) {

			String action = intent.getAction();
			CRLog.debug(TAG, "HeadsetReceiver : " + action);
			// 监听到耳机插拔事件，耳机插入不外放，耳机拔出使用外放
			if (intent.hasExtra("state")) {
				int state = intent.getIntExtra("state", 0);
				CRLog.debug(TAG, "HeadsetReceiver state:" + state);
				CloudroomVideoMeeting.getInstance()
						.setSpeakerOut(!(state == 1));
			}
		}
	}

	private OnTouchListener mTouchListener = new OnTouchListener() {

		private int lastX;
		private int lastY;

		@Override
		public boolean onTouch(View v, MotionEvent event) {

			int action = event.getAction();
			switch (action) {
			case MotionEvent.ACTION_DOWN:
				lastX = (int) event.getRawX();
				lastY = (int) event.getRawY();
				break;
			case MotionEvent.ACTION_MOVE:
				DisplayMetrics dm = getResources().getDisplayMetrics();
				int screenWidth = dm.widthPixels;
				int screenHeight = dm.heightPixels;
				int dx = (int) event.getRawX() - lastX;
				int dy = (int) event.getRawY() - lastY;

				int left = v.getLeft() + dx;
				int top = v.getTop() + dy;
				int right = v.getRight() + dx;
				int bottom = v.getBottom() + dy;
				if (left < 0) {
					left = 0;
					right = left + v.getWidth();
				}
				if (right > screenWidth) {
					right = screenWidth;
					left = right - v.getWidth();
				}
				if (top < 0) {
					top = 0;
					bottom = top + v.getHeight();
				}
				if (bottom > screenHeight) {
					bottom = screenHeight;
					top = bottom - v.getHeight();
				}
				v.layout(left, top, right, bottom);
				lastX = (int) event.getRawX();
				lastY = (int) event.getRawY();
				break;
			case MotionEvent.ACTION_UP:
				break;
			}
			return true;
		}
	};

	@Override
	public boolean onTouch(View v, MotionEvent event) {

		int action = event.getAction();
		switch (action) {
		case MotionEvent.ACTION_DOWN:
		case MotionEvent.ACTION_UP:
			showOptionBar();
			break;
		}
		return true;
	}

	/**
	 * 显示工具条
	 */
	private void showOptionBar() {
		Log.d(TAG, "showOption");
		mMainHandler.removeMessages(MSG_HIDE_OPTION);
		mOPtionsView.setVisibility(View.VISIBLE);
		mMainHandler.sendEmptyMessageDelayed(MSG_HIDE_OPTION, 3 * 1000);
	}

	/**
	 * 隐藏工具条
	 */
	private void hideOptionBar() {
		Log.d(TAG, "hideOption");
		mMainHandler.removeMessages(MSG_HIDE_OPTION);
		mOPtionsView.setVisibility(View.GONE);
	}

	private void startSvrRecord() {
		JsonArray layoutConfig = getSvrRecContents(RECORD_SIZE);
		JsonObject videoFileCfg = new JsonObject();
		videoFileCfg.addProperty("vWidth", RECORD_SIZE.width);
		videoFileCfg.addProperty("vHeight", RECORD_SIZE.height);
		videoFileCfg.addProperty("vFps", 15);
		// 录制文件名称
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
		Date date = new Date(System.currentTimeMillis());
		String fileName = String.format("%s_Android.mp4", format.format(date));
		String serverDir = fileName.substring(0, 10);
		String serverPathFileName = "/" + serverDir + "/" + fileName;
		videoFileCfg.addProperty("svrPathName", serverPathFileName);

		videoFileCfg.add("layoutConfig", layoutConfig);

		JsonObject mixerCfg = new JsonObject();
		mixerCfg.add("videoFileCfg", videoFileCfg);
		mixerCfg.addProperty("mode", 0);

		String mixerID = CloudroomVideoMeeting.getInstance().createCloudMixer(mixerCfg.toString());
		if (TextUtils.isEmpty(mixerID)) {
			CRLog.debug(TAG, "createCloudMixer fail");
			return;
		} else {
			CRLog.debug(TAG, "createCloudMixer success, mixerID:" + mixerID);
		}
		mMixerID = mixerID;

		mStartSvrBtn.setVisibility(View.GONE);
		mStopSvrBtn.setVisibility(View.VISIBLE);

		UITool.showProcessDialog(this, getString(R.string.starting_svrrecord));
	}

	private static final String KEY_SVR_REC_MIXERID = "KEY_SVR_REC_MIXERID";

	private static final Size RECORD_SIZE = new Size(864, 480);

	private void updateSvrRecContents() {
		if (!VideoSDKHelper.getInstance().bServer()) {
			return;
		}
		MIXER_STATE state = CloudroomVideoMeeting.getInstance()
				.getSvrMixerState();
		if (state == MIXER_STATE.MIXER_NULL) {
			return;
		}
		JsonArray layoutConfig = getSvrRecContents(RECORD_SIZE);
		JsonObject videoFileCfg = new JsonObject();
		videoFileCfg.add("layoutConfig", layoutConfig);
		JsonObject content = new JsonObject();
		content.add("videoFileCfg", videoFileCfg);
		CloudroomVideoMeeting.getInstance().updateCloudMixerContent(mMixerID, content.toString());
	}

	private void stopSvrRecord() {
		CloudroomVideoMeeting.getInstance().destroyCloudMixer(mMixerID);
		mStartSvrBtn.setVisibility(View.VISIBLE);
		mStopSvrBtn.setVisibility(View.GONE);
		mMixerID = null;
	}

	private JsonArray getSvrRecContents(Size recordSize) {
		ArrayList<UsrVideoId> videos = CloudroomVideoMeeting.getInstance()
				.getWatchableVideos();

		String myUserId = CloudroomVideoMeeting.getInstance().getMyUserID();

		UsrVideoId myVideoId = null;
		UsrVideoId peerVideoId = null;
		for (UsrVideoId usrVideoId : videos) {
			if (usrVideoId.userId.equals(myUserId)) {
				myVideoId = new UsrVideoId(usrVideoId.userId, (short) -1);
			} else if (usrVideoId.userId.equals(mPeerUserId)) {
				peerVideoId = new UsrVideoId(usrVideoId.userId, (short) -1);
			}
		}

		JsonArray contents = new JsonArray();

		// 录制区域为录制视频的大小
		int recWidth = recordSize.width;
		int recHeight = recordSize.height;

		int subWidth = recWidth / 4;
		int subHeight = recHeight / 4;
		// 竖屏情况
		if (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT) {
			subWidth = recHeight / 4;
			subHeight = recWidth / 4;
		}

		Rect videoRect = new Rect(0, 0, recWidth, recHeight);
		if (peerVideoId != null) {
			// 录制对端的摄像头
			JsonObject videoItem = MixerContentHelper.createVideoContent(mPeerUserId,
					peerVideoId.videoID, videoRect);
			videoItem.addProperty("keepAspectRatio", true);
			// 添加到录制内容列表
			contents.add(videoItem);

			videoRect = new Rect(recWidth - subWidth, recHeight - subHeight,
					recWidth, recHeight);
		}
		if (myVideoId != null) {
			// 录制自己的摄像头
			JsonObject videoItem = MixerContentHelper.createVideoContent(myUserId,
					myVideoId.videoID, videoRect);
			videoItem.addProperty("keepAspectRatio", true);
			// 添加到录制内容列表
			contents.add(videoItem);
		}
		CRLog.debug(TAG, "getSvrRecContents " + contents.size());

		// 添加录制时间戳
		int timeHeight = (recWidth > recHeight ? recHeight : recWidth) / 12;
		int timeWidth = timeHeight * 8;
		contents.add(MixerContentHelper.createTimeStampContent(new Rect(0, 0, timeWidth, timeHeight)));

		return contents;
	}
}
