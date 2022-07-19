package com.examples.common;

import java.util.ArrayList;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.os.Handler;
import android.os.Handler.Callback;
import android.os.Message;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.cloudroom.cloudroomvideosdk.CRMgrCallback;
import com.cloudroom.cloudroomvideosdk.CRQueueCallback;
import com.cloudroom.cloudroomvideosdk.CloudroomQueue;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMgr;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_ERR_DEF;
import com.cloudroom.cloudroomvideosdk.model.QueueInfo;
import com.cloudroom.cloudroomvideosdk.model.QueuingInfo;
import com.example.videocalldemo.R;
import com.examples.tool.CRLog;

/**
 * 排队界面
 * 
 * @author lake
 * 
 */
public class QueuingDialog extends Dialog implements Callback,
		OnDismissListener {

	private static final String TAG = "Queuingdialog";
	// 消息处理器
	private Handler mMainHandler = new Handler(this);
	// 排队信息
	private QueuingInfo mQueuingInfo = null;

	private TextView mQueueTimeTV = null;
	private TextView mQueueInfoTV = null;

	private static final int MSG_UPDATE_QUEUINGDIALOG = 101;

	private CRQueueCallback mQueueCallback = new CRQueueCallback() {

		@Override
		public void queuingInfoChanged(QueuingInfo queuingInfo) {

			updateQueuingDialog(queuingInfo);
		}

		@Override
		public void stopQueuingRslt(CRVIDEOSDK_ERR_DEF errCode, String cookie) {

			dismiss();
		}

	};

	private CRMgrCallback mMgrCallback = new CRMgrCallback() {

		@Override
		public void acceptCallSuccess(String callID, String cookie) {

			dismiss();
		}

	};

	// 消息处理函数
	@Override
	public boolean handleMessage(Message msg) {

		switch (msg.what) {
		case MSG_UPDATE_QUEUINGDIALOG:
			// 排队信息变动
			QueuingInfo info = (QueuingInfo) msg.obj;
			updateQueuingDialog(info);
			break;
		default:
			break;
		}
		return false;
	}

	public QueuingDialog(Context context, QueuingInfo info) {
		super(context, R.style.CommonDialog);
		// TODO Auto-generated constructor stub
		mQueuingInfo = info;

		initViews();

		updateQueuingDialog(mQueuingInfo);
	}

	@SuppressLint("InflateParams")
	private void initViews() {
		setCancelable(false);
		View view = getLayoutInflater().inflate(R.layout.layout_queuing_dialog,
				null);
		setContentView(view);

		mQueueTimeTV = (TextView) view.findViewById(R.id.tv_queue_time);
		mQueueInfoTV = (TextView) view.findViewById(R.id.tv_queue_info);

		// 获取队列名称
		String queueName = "";
		ArrayList<QueueInfo> queueInfos = VideoSDKHelper.getInstance()
				.getQueueInfos();
		for (QueueInfo queueInfo : queueInfos) {
			if (queueInfo.queID == mQueuingInfo.queID) {
				queueName = queueInfo.name;
			}
		}
		// 显示排队提示
		String waitTxt = getContext().getString(R.string.queuing_info,
				queueName);
		TextView waitTV = (TextView) view.findViewById(R.id.tv_wait_info);
		waitTV.setText(waitTxt);

		// 取消排队按钮响应设置
		Button cancel = (Button) view.findViewById(R.id.btn_cancel_queue);
		cancel.setOnClickListener(new View.OnClickListener() {

			@Override
			public void onClick(View v) {

				// 停止更新排队时间
				mMainHandler.removeMessages(MSG_UPDATE_QUEUINGDIALOG);
				// 取消排队
				CloudroomQueue.getInstance().stopQueuing("");
			}
		});
		setOnDismissListener(this);
	}

	@Override
	public void show() {

		super.show();
		// 接受管理消息
		CloudroomVideoMgr.getInstance().registerCallback(mMgrCallback);
		// 接受队列消息
		CloudroomQueue.getInstance().registerCallback(mQueueCallback);
	}

	@Override
	public void onDismiss(DialogInterface dialog) {

		mMainHandler.removeMessages(MSG_UPDATE_QUEUINGDIALOG);
		// 取消接受管理消息
		CloudroomVideoMgr.getInstance().unregisterCallback(mMgrCallback);
		// 取消接受队列消息
		CloudroomQueue.getInstance().unregisterCallback(mQueueCallback);
	}

	private void updateQueuingDialog(QueuingInfo info) {
		CRLog.debug(TAG, "updateQueuingDialog position:" + info.position
				+ "  queuingTime:" + info.queuingTime);

		String timeStr = getContext().getString(R.string.queuing_time,
				info.queuingTime / 60, info.queuingTime % 60);
		mQueueTimeTV.setText(timeStr);

		int pos = info.position > 1 ? (info.position - 1) : 0;
		String txt = getContext().getString(R.string.queuing_pos, pos);
		mQueueInfoTV.setText(txt);

		mMainHandler.removeMessages(MSG_UPDATE_QUEUINGDIALOG);
		Message msg = mMainHandler.obtainMessage(MSG_UPDATE_QUEUINGDIALOG);
		info.queuingTime++;
		msg.obj = info;
		msg.arg1 = 0;
		mMainHandler.sendMessageDelayed(msg, 1000);
	}

	public void stopQueuingRslt(final CRVIDEOSDK_ERR_DEF errCode, String cookie) {
		if (errCode == CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_NOERR) {
			this.dismiss();
		}
	}

}
