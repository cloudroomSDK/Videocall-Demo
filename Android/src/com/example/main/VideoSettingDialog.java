package com.example.main;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.Spinner;

import com.cloudroom.cloudroomvideosdk.CloudroomVideoMeeting;
import com.cloudroom.cloudroomvideosdk.model.Size;
import com.cloudroom.cloudroomvideosdk.model.VideoCfg;
import com.example.videocalldemo.R;
import com.examples.tool.CRLog;

/**
 * 设置界面
 * 
 * @author lake
 * 
 */
@SuppressLint({ "InflateParams", "DefaultLocale" })
public class VideoSettingDialog extends Dialog {

	private static final String TAG = "SettingDialog";

	private View mContentView = null;

	private Spinner videoResolution = null;
	private Spinner videoMinQuality = null;
	private Spinner videoMaxQuality = null;
	private Spinner videoFps = null;

	public VideoSettingDialog(Context context) {
		super(context, R.style.CommonDialog);
		// TODO Auto-generated constructor stub
		mContentView = getLayoutInflater().inflate(R.layout.layout_setting,
				null);
		// 显示视频需要启用hardwareAccelerated，某些设备会导致控件花屏，需要把不需要使用硬件加速的控件关闭硬件加速功能
		mContentView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
		setContentView(mContentView);
		initViews();
		// 设置默认值
		VideoCfg videoCfg = new VideoCfg();
		videoCfg.fps = 15;
		videoCfg.maxbps = -1;
		videoCfg.minQuality = 22;
		videoCfg.maxQuality = 36;
		videoCfg.size = new Size(864, 480);
		initVideoCfgShow(videoCfg);
	}

	private Size parseResolution(String resolutionStr) {
		String[] strs = resolutionStr.split("\\*");
		int recWidth = Integer.parseInt(strs[0]);
		int recHeight = Integer.parseInt(strs[1]);
		return new Size(recWidth, recHeight);
	}

	private void initViews() {
		mContentView.findViewById(R.id.btn_cacel).setOnClickListener(listener);
		mContentView.findViewById(R.id.btn_ok).setOnClickListener(listener);

		// 视频设置控件
		videoResolution = (Spinner) mContentView
				.findViewById(R.id.btn_video_resolution);

		videoMinQuality = (Spinner) mContentView
				.findViewById(R.id.btn_video_minquality);
		videoMaxQuality = (Spinner) mContentView
				.findViewById(R.id.btn_video_maxquality);

		videoFps = (Spinner) mContentView.findViewById(R.id.btn_video_fps);

		videoMinQuality
				.setOnItemSelectedListener(mVideoMinQualitySelectedListener);

		videoMaxQuality
				.setOnItemSelectedListener(mVideoMaxQualitySelectedListener);
	}

	private void initVideoCfgShow(VideoCfg cfg) {
		videoResolution.setSelection(getResolutionIndex(R.array.videosizes,
				cfg.size));
		videoMinQuality.setSelection(getIndexInStringArray(R.array.minquality,
				"" + cfg.minQuality));
		videoMaxQuality.setSelection(getIndexInStringArray(R.array.maxquality,
				"" + cfg.maxQuality));

		videoFps.setSelection(getIndexInStringArray(R.array.fps, "" + cfg.fps));
	}

	@Override
	public void show() {

		VideoCfg cfg = CloudroomVideoMeeting.getInstance().getVideoCfg();
		initVideoCfgShow(cfg);
		super.show();
	}

	public VideoCfg getVideoCfg() {
		// 获取视频质量设置
		int minQuality = Integer.parseInt((String) videoMinQuality
				.getSelectedItem());
		int maxQuality = Integer.parseInt((String) videoMaxQuality
				.getSelectedItem());
		// 获取视频帧率设置
		int fps = Integer.parseInt((String) videoFps.getSelectedItem());
		// 获取视频分辨率设置
		String resolutionStr = (String) videoResolution.getSelectedItem();
		Size size = parseResolution(resolutionStr);

		VideoCfg cfg = CloudroomVideoMeeting.getInstance().getVideoCfg();
		cfg.maxQuality = maxQuality;
		cfg.minQuality = minQuality;
		cfg.size = size;
		cfg.fps = fps;
		cfg.maxbps = -1;
		return cfg;
	}

	@SuppressLint("DefaultLocale")
	private void resetVideoCfg() {
		VideoCfg cfg = getVideoCfg();
		String log = String.format("resetVideoCfg size:%s Quality:%d-%d",
				cfg.size.toString(), cfg.minQuality, cfg.maxQuality);
		CRLog.debug(TAG, log);
		CloudroomVideoMeeting.getInstance().setVideoCfg(cfg);

		cfg = CloudroomVideoMeeting.getInstance().getVideoCfg();
		CRLog.debug(TAG, "resetVideoCfg rslt size:" + cfg.size + " minQuality:"
				+ cfg.minQuality + " maxQuality:" + cfg.maxQuality);
	}

	private View.OnClickListener listener = new View.OnClickListener() {

		@Override
		public void onClick(View v) {

			switch (v.getId()) {
			case R.id.btn_cacel:
				try {
					dismiss();
				} catch (Exception e) {
					// TODO: handle exception
				}
				break;
			case R.id.btn_ok:
				// 应用视频相关设置
				resetVideoCfg();
				try {
					dismiss();
				} catch (Exception e) {
					// TODO: handle exception
				}
				break;
			default:
				break;
			}
		}
	};

	private OnItemSelectedListener mVideoMinQualitySelectedListener = new OnItemSelectedListener() {

		@Override
		public void onItemSelected(AdapterView<?> parent, View view,
				int position, long id) {

			String[] minQualitys = getContext().getResources().getStringArray(
					R.array.minquality);
			String[] maxQualitys = getContext().getResources().getStringArray(
					R.array.maxquality);
			int maxQuality = videoMaxQuality.getSelectedItemPosition()
					+ Integer.parseInt(maxQualitys[0]);
			int minQuality = position + Integer.parseInt(minQualitys[0]);
			if (maxQuality < minQuality) {
				maxQuality += 10;
				int index = maxQuality - Integer.parseInt(maxQualitys[0]);
				if (index > maxQualitys.length - 1) {
					index = maxQualitys.length - 1;
				}
				videoMaxQuality.setSelection(index);
			}
		}

		@Override
		public void onNothingSelected(AdapterView<?> arg0) {


		}
	};

	private OnItemSelectedListener mVideoMaxQualitySelectedListener = new OnItemSelectedListener() {

		@Override
		public void onItemSelected(AdapterView<?> parent, View view,
				int position, long id) {

			Spinner videoMinQuality = (Spinner) mContentView
					.findViewById(R.id.btn_video_maxquality);
			String[] minQualitys = getContext().getResources().getStringArray(
					R.array.minquality);
			String[] maxQualitys = getContext().getResources().getStringArray(
					R.array.maxquality);
			int minQuality = videoMinQuality.getSelectedItemPosition()
					+ Integer.parseInt(minQualitys[0]);
			int maxQuality = position + Integer.parseInt(maxQualitys[0]);
			if (minQuality > maxQuality) {
				minQuality -= 10;
				int index = minQuality - Integer.parseInt(minQualitys[0]);
				if (index < 0) {
					index = 0;
				}
				videoMinQuality.setSelection(index);
			}
		}

		@Override
		public void onNothingSelected(AdapterView<?> parent) {


		}
	};

	private int getResolutionIndex(int arrayID, Size recResolution) {
		String[] array = getContext().getResources().getStringArray(arrayID);
		String str1 = String.format("%d*%d", recResolution.width,
				recResolution.height);
		String str2 = String.format("%d*%d", recResolution.height,
				recResolution.width);
		int i = 0;
		for (String string : array) {
			if (string.endsWith(str1) || string.equals(str2)) {
				return i;
			}
			i++;
		}
		return 0;
	}

	private int getIndexInStringArray(int arrayID, String value) {
		String[] array = getContext().getResources().getStringArray(arrayID);
		int i = 0;
		for (String string : array) {
			if (string.endsWith(value)) {
				return i;
			}
			i++;
		}
		return 0;
	}
}
