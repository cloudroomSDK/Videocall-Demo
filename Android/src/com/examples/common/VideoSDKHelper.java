package com.examples.common;

import java.util.ArrayList;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Handler;
import android.text.TextUtils;
import android.widget.Toast;

import com.cloudroom.cloudroomvideosdk.CRMeetingCallback;
import com.cloudroom.cloudroomvideosdk.CRMgrCallback;
import com.cloudroom.cloudroomvideosdk.CRQueueCallback;
import com.cloudroom.cloudroomvideosdk.CloudroomQueue;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMeeting;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMgr;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_ERR_DEF;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_MEETING_DROPPED_REASON;
import com.cloudroom.cloudroomvideosdk.model.QueueInfo;
import com.example.videocalldemo.R;
import com.examples.tool.Tools;
import com.examples.tool.UITool;

@SuppressLint("HandlerLeak")
/**
 * 本地管理类
 * @author admin
 *
 */
public class VideoSDKHelper {

	private static final String TAG = "VideoCallSDKMgr";

	private Handler mMainHandler = new Handler();

	private VideoSDKHelper() {
		CloudroomVideoMgr.getInstance().registerCallback(mMgrCallback);
		CloudroomVideoMeeting.getInstance().registerCallback(mMeetingCallback);
		CloudroomQueue.getInstance().registerCallback(mQueueCallback);
	}

	private static VideoSDKHelper mInstance = null;

	public static VideoSDKHelper getInstance() {
		synchronized (TAG) {
			if (mInstance == null) {
				mInstance = new VideoSDKHelper();
			}
		}
		return mInstance;
	}

	private CRMgrCallback mMgrCallback = new CRMgrCallback() {

		// 登陆失败
		@Override
		public void loginFail(CRVIDEOSDK_ERR_DEF sdkErr, String cookie) {
			
			mCallId = null;
			mLoginUserID = null;
			mBServer = false;
		}

		// 登陆成功
		@Override
		public void loginSuccess(String usrID, String cookie) {
			mLoginUserID = usrID;
			boolean bServer = "server".equals(cookie);
			mBServer = bServer;
		}

		@Override
		public void lineOff(CRVIDEOSDK_ERR_DEF sdkErr) {
			
			mCallId = null;
			mLoginUserID = null;
			mBServer = false;
		}

		@Override
		public void notifyCallHungup(String callID, final String useExtDat) {
			
			mEnterTime = 0;
		}

		@Override
		public void hangupCallSuccess(String callID, String cookie) {
			
			mEnterTime = 0;
		}
	};

	private CRQueueCallback mQueueCallback = new CRQueueCallback() {

		@Override
		public void initQueueDatRslt(CRVIDEOSDK_ERR_DEF errCode, String cookie) {
			
			mQueueInfos.clear();
			mQueueInfos.addAll(CloudroomQueue.getInstance().getAllQueueInfo());

			mServiceQueues.clear();
			mServiceQueues.addAll(CloudroomQueue.getInstance()
					.getServiceQueues());
		}

	};

	private CRMeetingCallback mMeetingCallback = new CRMeetingCallback() {

		@Override
		public void enterMeetingRslt(CRVIDEOSDK_ERR_DEF code) {
			
			if (code == CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR) {
				mBInMeeting = true;
				mEnterTime = System.currentTimeMillis();
			} else {
				mBInMeeting = false;
			}
		}

		@Override
		public void meetingDropped(CRVIDEOSDK_MEETING_DROPPED_REASON reason) {
			mBInMeeting = false;
		}

		@Override
		public void meetingStopped() {
			mBInMeeting = false;
		}

	};

	private boolean mBInMeeting = false;
	private String mLoginUserID = null;

	public String getLoginUserID() {
		return mLoginUserID;
	}

	public boolean isInMeeting() {
		return mBInMeeting;
	}

	private boolean mBServer = false;
	private String mCallId = null;
	private long mEnterTime = 0;
	private ArrayList<QueueInfo> mQueueInfos = new ArrayList<QueueInfo>();
	private ArrayList<Integer> mServiceQueues = new ArrayList<Integer>();

	public boolean bServer() {
		return mBServer;
	}

	public String getCallId() {
		return mCallId;
	}

	public void setCallId(String callId) {
		this.mCallId = callId;
	}

	public long getEnterTime() {
		return mEnterTime;
	}

	public ArrayList<QueueInfo> getQueueInfos() {
		return mQueueInfos;
	}

	public ArrayList<Integer> getServiceQueues() {
		return mServiceQueues;
	}

	public String getErrStr(CRVIDEOSDK_ERR_DEF errCode) {
		String str = Tools.LoadString(mContext, errCode.toString());
		if(TextUtils.isEmpty(str)) {
			str = mContext.getString(R.string.CRVIDEOSDK_UNKNOWERR);
		}
		return str;
	}

	private Context mContext = null;

	public void setContext(Context context) {
		this.mContext = context;
	}

	private Toast mToast = null;

	/**
	 * 显示Toast提示
	 * 
	 * @param txt
	 *            Toast文字
	 */
	public void showToast(final String txt) {
		if (TextUtils.isEmpty(txt)) {
			return;
		}
		mMainHandler.post(new Runnable() {

			@Override
			public void run() {
				try {
					if (mToast != null) {
						mToast.cancel();
					}
					mToast = Toast.makeText(mContext, txt, Toast.LENGTH_LONG);
					mToast.show();
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}

	/**
	 * 显示Toast提示
	 * 
	 * @param id
	 */
	public void showToast(int id) {
		showToast(mContext.getString(id));
	}

	/**
	 * 显示Toast提示
	 * 
	 * @param txt
	 * @param err
	 */
	public void showToast(String txt, CRVIDEOSDK_ERR_DEF err) {
		String text = String.format("%s ( %s )", txt, VideoSDKHelper
				.getInstance().getErrStr(err));
		showToast(text);
	}

	/**
	 * 显示Toast提示
	 * 
	 * @param id
	 * @param err
	 */
	public void showToast(final int id, final CRVIDEOSDK_ERR_DEF err) {
		showToast(mContext.getString(id), err);
	}
}
