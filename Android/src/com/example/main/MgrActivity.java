package com.example.main;

import java.util.ArrayList;
import java.util.List;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnDismissListener;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.ListView;
import android.widget.TextView;

import com.cloudroom.cloudroomvideosdk.CRMgrCallback;
import com.cloudroom.cloudroomvideosdk.CRQueueCallback;
import com.cloudroom.cloudroomvideosdk.CloudroomQueue;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMgr;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoSDK;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_ERR_DEF;
import com.cloudroom.cloudroomvideosdk.model.MeetInfo;
import com.cloudroom.cloudroomvideosdk.model.QueueInfo;
import com.cloudroom.cloudroomvideosdk.model.QueueStatus;
import com.cloudroom.cloudroomvideosdk.model.QueuingInfo;
import com.cloudroom.cloudroomvideosdk.model.SDK_LOG_LEVEL_DEF;
import com.cloudroom.cloudroomvideosdk.model.UserInfo;
import com.cloudroom.cloudroomvideosdk.model.VideoSessionInfo;
import com.example.videocalldemo.R;
import com.examples.common.QueuingDialog;
import com.examples.common.VideoSDKHelper;
import com.examples.tool.UITool;
import com.examples.tool.UITool.ConfirmDialogCallback;
import com.examples.tool.UITool.InputDialogCallback;

@SuppressLint({ "InflateParams", "NewApi", "HandlerLeak" })
/**
 * 呼叫界面
 * @author admin
 *
 */
public class MgrActivity extends BaseActivity {

	private static final String TAG = "MgrActivity";

	private ListView mListView = null;

	private Button mGetNextUserBTN = null;
	private CheckBox mAudoGetUserCB = null;

	private ArrayAdapter<QueueInfo> mAdapter = null;

	private CRMgrCallback mMgrCallback = new CRMgrCallback() {

		@Override
		public void lineOff(CRVIDEOSDK_ERR_DEF sdkErr) {
			// TODO Auto-generated method stub
			VideoSDKHelper.getInstance().showToast("掉线",
					(CRVIDEOSDK_ERR_DEF) sdkErr);
			finish();
		}

		@Override
		public void createMeetingFail(CRVIDEOSDK_ERR_DEF sdkErr, String cookie) {
			// TODO Auto-generated method stub
			mAcceptAssignUser = false;
			mAssignUserInfo = null;
		}

		@Override
		public void createMeetingSuccess(MeetInfo meetInfo, String cookie) {
			// TODO Auto-generated method stub
			if (mAcceptAssignUser && mAssignUserInfo != null) {
				CloudroomVideoMgr.getInstance().call(mAssignUserInfo.usrID,
						meetInfo, "", TAG);
				VideoActivity.mPeerUserId = mAssignUserInfo.usrID;
			}
		}

		@Override
		public void notifyCallIn(String callID, MeetInfo meetInfo,
				String callerID, String param) {
			// TODO Auto-generated method stub
			Log.d(TAG, "notifyCallIn callID:" + callID + " callerID:"
					+ callerID + " param:" + param);
			// 提示收到呼叫
			VideoSDKHelper.getInstance().showToast(R.string.call_in);

			// 自动接受呼叫
			CloudroomVideoMgr.getInstance().acceptCall(callID, meetInfo, "");

			// 保存呼叫ID
			VideoSDKHelper.getInstance().setCallId(callID);
			// 保存对方用户ID
			VideoActivity.mPeerUserId = callerID;

			// 进入会议
			enterVideo(meetInfo.ID, meetInfo.pswd);
		}

		@Override
		public void notifyCallAccepted(String callID, MeetInfo meetInfo,
				String useExtDat) {
			// TODO Auto-generated method stub
			VideoSDKHelper.getInstance().showToast(R.string.call_accept);

			VideoSDKHelper.getInstance().setCallId(callID);
			enterVideo(meetInfo.ID, meetInfo.pswd);
			if (callID.equals(mCallingID)) {
				UITool.hideProcessDialog(MgrActivity.this);
				mCallingID = null;
			}
		}

		@Override
		public void acceptCallFail(String callID, CRVIDEOSDK_ERR_DEF sdkErr,
				String cookie) {
			// TODO Auto-generated method stub
		}

		@Override
		public void acceptCallSuccess(String callID, String cookie) {
			// TODO Auto-generated method stub
		}

		@Override
		public void callFail(String callID, CRVIDEOSDK_ERR_DEF sdkErr,
				String cookie) {
			// TODO Auto-generated method stub
			if (callID.equals(mCallingID)) {
				UITool.hideProcessDialog(MgrActivity.this);
				mCallingID = null;
			}
		}

		@Override
		public void callSuccess(String callID, String cookie) {
			// TODO Auto-generated method stub
		}

		@Override
		public void notifyCallRejected(String callID,
				CRVIDEOSDK_ERR_DEF reason, String useExtDat) {
			// TODO Auto-generated method stub
			if (callID.equals(mCallingID)) {
				UITool.hideProcessDialog(MgrActivity.this);
				mCallingID = null;
			}
		}

	};

	private CRQueueCallback mQueueCallback = new CRQueueCallback() {

		@Override
		public void initQueueDatRslt(CRVIDEOSDK_ERR_DEF errCode, String cookie) {
			// TODO Auto-generated method stub
			// 更新队列ListView
			mAdapter.notifyDataSetChanged();

			// 查询是否正在排队，有就显示排队界面
			QueuingInfo queuingInfo = CloudroomQueue.getInstance()
					.getQueuingInfo();
			if (queuingInfo != null && queuingInfo.queID > 0) {
				QueuingDialog dialog = new QueuingDialog(MgrActivity.this,
						queuingInfo);
				dialog.show();
			}

			// 查询是否有正在进行的视频
			VideoSessionInfo sessionInfo = CloudroomQueue.getInstance()
					.getSessionInfo();
			if (sessionInfo != null && sessionInfo.meetingID > 0
					&& !TextUtils.isEmpty(sessionInfo.callID)) {
				VideoSDKHelper.getInstance()
						.showToast(R.string.restore_session);
				VideoSDKHelper.getInstance().setCallId(sessionInfo.callID);
				VideoActivity.mPeerUserId = sessionInfo.peerID;
				CloudroomVideoSDK.getInstance().writeLog(
						SDK_LOG_LEVEL_DEF.SDKLEVEL_INFO,
						"VideoSessionInfo:" + sessionInfo.peerID);

				// 进入视频
				enterVideo(sessionInfo.meetingID, sessionInfo.meetingPswd);
			}
		}

		@Override
		public void queueStatusChanged(QueueStatus queStatus) {
			// TODO Auto-generated method stub
			// 更新列表
			mAdapter.notifyDataSetChanged();
		}

		@Override
		public void startQueuingRslt(CRVIDEOSDK_ERR_DEF errCode, String cookie) {
			// TODO Auto-generated method stub
			// 排队成功显示排队界面
			if (errCode == CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR) {
				QueuingInfo queuingInfo = CloudroomQueue.getInstance()
						.getQueuingInfo();
				QueuingDialog dialog = new QueuingDialog(MgrActivity.this,
						queuingInfo);
				dialog.show();
			} else {
				VideoSDKHelper.getInstance().showToast(R.string.queue_fail,
						errCode);
			}
		}

		@Override
		public void cancelAssignUser(int queID, String usrID) {
			// TODO Auto-generated method stub
			if (mAssignDailog != null) {
				mAssignDailog.dismiss();
				mAssignDailog = null;
			}
		}

		@Override
		public void autoAssignUser(UserInfo usr) {
			// TODO Auto-generated method stub
			assignUser(usr);
		}

		@Override
		public void reqAssignUserRslt(CRVIDEOSDK_ERR_DEF sdkErr, UserInfo usr,
				String cookie) {
			// TODO Auto-generated method stub
			if (sdkErr == CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR && usr != null) {
				mAcceptAssignUser = true;
				mAssignUserInfo = usr;
				CloudroomVideoMgr.getInstance().createMeeting(usr.usrID, false);
			} else {
				VideoSDKHelper.getInstance().showToast("分配客户失败", sdkErr);
			}
		}

		@Override
		public void startServiceRslt(int queID, CRVIDEOSDK_ERR_DEF sdkErr,
				String cookie) {
			// TODO Auto-generated method stub
			if (sdkErr == CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR) {
				ArrayList<Integer> services = VideoSDKHelper.getInstance()
						.getServiceQueues();
				services.add(Integer.valueOf(queID));

				serviceQueuesChanged(queID);
			}
		}

		@Override
		public void stopServiceRslt(int queID, CRVIDEOSDK_ERR_DEF sdkErr,
				String cookie) {
			// TODO Auto-generated method stub
			if (sdkErr != CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR) {
				return;
			}
			ArrayList<Integer> services = VideoSDKHelper.getInstance()
					.getServiceQueues();
			services.remove(Integer.valueOf(queID));
			serviceQueuesChanged(queID);
		}

		@Override
		public void responseAssignUserRslt(CRVIDEOSDK_ERR_DEF sdkErr,
				String cookie) {
			// TODO Auto-generated method stub
			if (mAcceptAssignUser) {
				CloudroomVideoMgr.getInstance().createMeeting(
						mAssignUserInfo.usrID, false);
			} else {
				mAssignUserInfo = null;
			}
		}

	};

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);
		// 根据是坐席还是用户显示不同的布局（实际开发可使用不同界面实现）
		boolean bServer = VideoSDKHelper.getInstance().bServer();
		setContentView(bServer ? R.layout.activity_server
				: R.layout.activity_user);

		// 接受队列消息
		CloudroomQueue.getInstance().registerCallback(mQueueCallback);
		// 接受管理消息
		CloudroomVideoMgr.getInstance().registerCallback(mMgrCallback);
		// 初始化呼叫队列（可多次调用）
		CloudroomQueue.getInstance().initQueue("");

		// 判断自己的登录账号是空就退出呼叫界面
		String myUserID = VideoSDKHelper.getInstance().getLoginUserID();
		if (TextUtils.isEmpty(myUserID)) {
			Log.w(TAG, "LoginUserID is null");
			finish();
		}

		// 根据是坐席还是用户做不同的处理（实际开发可使用不同界面实现）
		if (!VideoSDKHelper.getInstance().bServer()) {
			initUserViews();
		} else {
			initServerViews();
		}

		mListView.setAdapter(mAdapter);
	}

	@Override
	protected void onResume() {
		// TODO Auto-generated method stub
		super.onResume();
		// 每次进入界面刷新队列状态
		CloudroomQueue.getInstance().refreshAllQueueStatus();
	}

	@Override
	protected void onDestroy() {
		// TODO Auto-generated method stub
		super.onDestroy();
		// 取消接受管理消息
		CloudroomVideoMgr.getInstance().unregisterCallback(mMgrCallback);
		// 取消接受队列消息
		CloudroomQueue.getInstance().unregisterCallback(mQueueCallback);
	}

	public void onViewClick(View v) {
		if (v.getId() == R.id.titlebar_tv_left) {
			CloudroomVideoMgr.getInstance().logout();
			finish();
		} else if (v.getId() == R.id.btn_getuser) {
			CloudroomQueue.getInstance().reqAssignUser(TAG);
		} else if (v.getId() == R.id.titlebar_tv_right) {
			showCallDialog();
		}
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		// TODO Auto-generated method stub
		if (keyCode == KeyEvent.KEYCODE_BACK) {
			return true;
		}
		return super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onKeyUp(int keyCode, KeyEvent event) {
		// TODO Auto-generated method stub
		if (keyCode == KeyEvent.KEYCODE_BACK) {
			showExitDialog();
			return true;
		}
		return super.onKeyUp(keyCode, event);
	}

	/**
	 * 显示退出程序提示
	 */
	private void showExitDialog() {
		UITool.showConfirmDialog(this, getString(R.string.quit)
				+ getString(R.string.app_name), new ConfirmDialogCallback() {

			@Override
			public void onOk() {
				// TODO Auto-generated method stub
				// 退出程序
				DemoApp.getInstance().terminalApp();
			}

			@Override
			public void onCancel() {
				// TODO Auto-generated method stub

			}
		});
	}

	/**
	 * 进入视频界面
	 * 
	 * @param mode
	 * @param meetID
	 * @param meetPswd
	 */
	private void enterVideo(int meetID, String meetPswd) {
		Intent intent = new Intent(MgrActivity.this, VideoActivity.class);
		intent.putExtra("meetID", meetID);
		intent.putExtra("password", meetPswd);
		startActivity(intent);
	}

	private String mCallingID = null;

	private void showCallDialog() {
		UITool.showInputDialog(this, getString(R.string.input_peer_userid),
				new InputDialogCallback() {

					@Override
					public void onInput(String userID) {
						// TODO Auto-generated method stub
						if (TextUtils.isEmpty(userID)) {
							VideoSDKHelper.getInstance().showToast(
									R.string.input_peer_userid);
							return;
						}
						if (TextUtils.isEmpty(mCallingID)) {
							mCallingID = CloudroomVideoMgr.getInstance().call(
									userID, null, "");
							VideoActivity.mPeerUserId = userID;
							UITool.showProcessDialog(MgrActivity.this,
									getString(R.string.calling, userID));
						}
					}

					@Override
					public void onCancel() {
						// TODO Auto-generated method stub

					}
				});
	}

	/** 客户 begin **/

	private void initUserViews() {
		mListView = (ListView) findViewById(R.id.lv_user);

		mAdapter = new UserAdapter(this, R.layout.layout_user_item,
				VideoSDKHelper.getInstance().getQueueInfos());

		mListView.setOnItemClickListener(new OnItemClickListener() {

			@Override
			public void onItemClick(AdapterView<?> parent, View view,
					int position, long id) {
				// TODO Auto-generated method stub
				// 用户点击列表，开始排队
				QueueInfo info = VideoSDKHelper.getInstance().getQueueInfos()
						.get(position);
				CloudroomQueue.getInstance().startQueuing(info.queID, null);
			}
		});
	}

	private class UserAdapter extends ArrayAdapter<QueueInfo> {

		public UserAdapter(Context context, int textViewResourceId,
				List<QueueInfo> objects) {
			super(context, textViewResourceId, objects);
			// TODO Auto-generated constructor stub
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent) {
			// TODO Auto-generated method stub
			if (convertView == null) {
				convertView = getLayoutInflater().inflate(
						R.layout.layout_user_item, null);
			}
			QueueInfo info = getItem(position);
			updateItemView(convertView, info);

			return convertView;
		}

		public void updateItemView(int position, QueueInfo info) {
			int firstVisiblePosition = mListView.getFirstVisiblePosition();
			int lastVisiblePosition = mListView.getLastVisiblePosition();
			if (position >= firstVisiblePosition
					&& position <= lastVisiblePosition) {
				View view = mListView.getChildAt(position
						- firstVisiblePosition);
				updateItemView(view, info);
			}
		}

		public void updateItemView(View convertView, QueueInfo info) {
			TextView tv1 = (TextView) convertView.findViewById(R.id.tv_user1);
			TextView tv2 = (TextView) convertView.findViewById(R.id.tv_user2);
			TextView tv3 = (TextView) convertView.findViewById(R.id.tv_user3);

			QueueStatus status = CloudroomQueue.getInstance().getQueueStatus(
					info.queID);

			tv1.setText(info.name);
			tv2.setText("(" + status.wait_num + "人等待)");
			tv3.setText(info.desc);
		}
	}

	/** 客户 end **/

	/** 坐席 begin **/

	private void initServerViews() {
		mGetNextUserBTN = (Button) findViewById(R.id.btn_getuser);
		mAudoGetUserCB = (CheckBox) findViewById(R.id.cb_autogetuser);

		mAudoGetUserCB
				.setOnCheckedChangeListener(new OnCheckedChangeListener() {

					@Override
					public void onCheckedChanged(CompoundButton buttonView,
							boolean isChecked) {
						// TODO Auto-generated method stub
						// 设置免打扰状态
						mGetNextUserBTN.setEnabled(!isChecked);
						mGetNextUserBTN.setClickable(!isChecked);
						CloudroomVideoMgr.getInstance().setDNDStatus(
								isChecked ? 0 : 1, TAG);
					}
				});

		mListView = (ListView) findViewById(R.id.lv_server);
		mAdapter = new ServerAdapter(this, R.layout.layout_server_item,
				VideoSDKHelper.getInstance().getQueueInfos());

		mListView.setOnItemClickListener(new OnItemClickListener() {

			@Override
			public void onItemClick(AdapterView<?> parent, View view,
					int position, long id) {
				// TODO Auto-generated method stub
				// 坐席点击列表，开始服务点击的队列
				QueueInfo info = VideoSDKHelper.getInstance().getQueueInfos()
						.get(position);

				boolean bServer = false;
				ArrayList<Integer> services = VideoSDKHelper.getInstance()
						.getServiceQueues();
				for (Integer queID : services) {
					if (queID.intValue() == info.queID) {
						bServer = true;
						break;
					}
				}
				if (bServer) {
					CloudroomQueue.getInstance().stopService(info.queID, "");
				} else {
					CloudroomQueue.getInstance().startService(info.queID, "");
				}
			}
		});
		mListView.setAdapter(mAdapter);
	}

	private void serviceQueuesChanged(int queID) {
		ArrayList<QueueInfo> infos = VideoSDKHelper.getInstance()
				.getQueueInfos();
		int size = infos.size();
		for (int i = 0; i < size; i++) {
			QueueInfo info = infos.get(i);
			if (info.queID == queID) {
				if (mAdapter instanceof ServerAdapter) {
					((ServerAdapter) mAdapter).updateItemView(i, info);
				} else {
					((UserAdapter) mAdapter).updateItemView(i, info);
				}
				break;
			}
		}
	}

	private AlertDialog mAssignDailog = null;
	private UserInfo mAssignUserInfo = null;
	private boolean mAcceptAssignUser = false;

	private void assignUser(final UserInfo user) {
		Log.d(TAG, "assignUser");
		boolean bServer = VideoSDKHelper.getInstance().bServer();
		if (!bServer)
			return;
		mAssignUserInfo = user;
		String txt = getString(R.string.assign_uer, user.name);
		mAssignDailog = new AlertDialog.Builder(MgrActivity.this)
				.setTitle(R.string.prompt).setMessage(txt)
				.setOnDismissListener(new OnDismissListener() {

					@Override
					public void onDismiss(DialogInterface dialog) {
						// TODO Auto-generated method stub
						mAssignDailog = null;
					}
				}).setPositiveButton(R.string.accept, new OnClickListener() {

					@Override
					public void onClick(DialogInterface dialog, int which) {
						// TODO Auto-generated method stub
						// Log.d(TAG, "assignUser setPositiveButton ");
						Log.d(TAG, "assignUser:" + user.usrID);
						mAcceptAssignUser = true;
						CloudroomQueue.getInstance().acceptAssignUser(
								user.queID, user.usrID, TAG);
					}
				}).setNegativeButton(R.string.reject, new OnClickListener() {

					@Override
					public void onClick(DialogInterface dialog, int which) {
						// TODO Auto-generated method stub
						mAcceptAssignUser = false;
						CloudroomQueue.getInstance().rejectAssignUser(
								mAssignUserInfo.queID, mAssignUserInfo.usrID,
								TAG);
					}
				}).show();
	}

	private class ServerAdapter extends ArrayAdapter<QueueInfo> {

		public ServerAdapter(Context context, int textViewResourceId,
				List<QueueInfo> objects) {
			super(context, textViewResourceId, objects);
			// TODO Auto-generated constructor stub
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent) {
			// TODO Auto-generated method stub
			if (convertView == null) {
				convertView = getLayoutInflater().inflate(
						R.layout.layout_server_item, null);
			}
			QueueInfo info = getItem(position);

			updateItemView(convertView, info);

			return convertView;
		}

		public void updateItemView(int position, QueueInfo info) {
			int firstVisiblePosition = mListView.getFirstVisiblePosition();
			int lastVisiblePosition = mListView.getLastVisiblePosition();
			if (position >= firstVisiblePosition
					&& position <= lastVisiblePosition) {
				View view = mListView.getChildAt(position
						- firstVisiblePosition);
				updateItemView(view, info);
			}
		}

		public void updateItemView(View convertView, QueueInfo info) {
			TextView tv1 = (TextView) convertView.findViewById(R.id.tv_server1);
			TextView tv2 = (TextView) convertView.findViewById(R.id.tv_server2);
			TextView tv3 = (TextView) convertView.findViewById(R.id.tv_server3);
			QueueStatus status = CloudroomQueue.getInstance().getQueueStatus(
					info.queID);

			String txt = "未服务";
			ArrayList<Integer> services = VideoSDKHelper.getInstance()
					.getServiceQueues();
			for (Integer queID : services) {
				if (queID.intValue() == info.queID) {
					txt = "正在服务……";
					break;
				}
			}
			tv2.setText(txt);

			tv1.setText("窗口名称：" + info.name);

			tv3.setText("坐席人数：" + status.agent_num + "     排队人数："
					+ status.wait_num + "     会话中人数：" + status.srv_num);
		}
	}
	/** 坐席 end **/
}
