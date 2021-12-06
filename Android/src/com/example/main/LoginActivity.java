package com.example.main;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.text.Editable;
import android.text.Selection;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.TextView;

import com.cloudroom.cloudroomvideosdk.CRMgrCallback;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoMgr;
import com.cloudroom.cloudroomvideosdk.CloudroomVideoSDK;
import com.cloudroom.cloudroomvideosdk.model.CRVIDEOSDK_ERR_DEF;
import com.cloudroom.cloudroomvideosdk.model.LoginDat;
import com.example.videocalldemo.R;
import com.examples.common.VideoSDKHelper;
import com.examples.tool.CRLog;
import com.examples.tool.UITool;
import com.examples.tool.UITool.ConfirmDialogCallback;

@SuppressLint("HandlerLeak")
/**
 * 登录界面
 * @author admin
 *
 */
public class LoginActivity extends BaseActivity {

	private static final String TAG = "LoginActivity";

	private CRMgrCallback mLoginCallback = new CRMgrCallback() {

		// 登陆失败
		@Override
		public void loginFail(CRVIDEOSDK_ERR_DEF sdkErr, String cookie) {
			// TODO Auto-generated method stub
			// 登录按钮设置为可用
			mLoginBtn.setClickable(true);
			mLoginBtn.setEnabled(true);
			// 提示登录失败及原因
			VideoSDKHelper.getInstance().showToast(R.string.login_fail, sdkErr);
			// 如果是状态不对导致失败，恢复登录状态到未登陆
			if (sdkErr == CRVIDEOSDK_ERR_DEF.CRVIDEOSDK_LOGINSTATE_ERROR) {
				CloudroomVideoMgr.getInstance().logout();
			}
		}

		// 登陆成功
		@Override
		public void loginSuccess(String usrID, String cookie) {
			// TODO Auto-generated method stub
			CRLog.debug(TAG, "onLoginSuccess");
			// 登录按钮设置为可用
			mLoginBtn.setClickable(true);
			mLoginBtn.setEnabled(true);

			// 提示登录成功
			VideoSDKHelper.getInstance().showToast(R.string.login_success);
			// 跳转到登录成功之后的界面
			Intent intent = new Intent(LoginActivity.this, MgrActivity.class);
			startActivity(intent);
		}

	};

	private EditText mNicknameEditText = null;
	private RadioGroup mRadioGroup = null;
	private Button mLoginBtn = null;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_login);

        Activity lastActivity = DemoApp.getInstance().getLastActivity(this);
        if (lastActivity != null) {
            finish();
            return;
        }

		mNicknameEditText = (EditText) findViewById(R.id.et_nickname);

		mRadioGroup = (RadioGroup) findViewById(R.id.radio_user);

		mLoginBtn = (Button) findViewById(R.id.btn_login);

		TextView version = (TextView) findViewById(R.id.tv_version);
		version.setText(getString(R.string.sdk_ver)
				+ CloudroomVideoSDK.getInstance().GetCloudroomVideoSDKVer());

		// mNicknameEditText.setText(android.os.Build.MODEL);

		// 光标放到文字最后
		Editable text = mNicknameEditText.getText();
		Selection.setSelection(text, text.length());

		// 设置登录相关处理对象
		CloudroomVideoMgr.getInstance().registerCallback(mLoginCallback);
	}

	@Override
	protected void onDestroy() {
		// TODO Auto-generated method stub
		super.onDestroy();
		// 清空登录相关处理对象
		CloudroomVideoMgr.getInstance().unregisterCallback(mLoginCallback);
	}
	
	@Override
	protected void onResume() {
		super.onResume();
		if (SettingActivity.bSettingChanged) {
			CloudroomVideoMgr.getInstance().logout();
            if(SettingActivity.bInitDataChanged) {
                DemoApp.getInstance().uninitCloudroomVideoSDK();
                DemoApp.getInstance().initCloudroomVideoSDK();
            }
        }
        SettingActivity.bSettingChanged = false;
        SettingActivity.bInitDataChanged = false;
	}

	// 控件点击处理方法
	public void onViewClick(View v) {
		switch (v.getId()) {
		case R.id.btn_login:
			doLogin();
			break;
		case R.id.btn_server_setting:
			openSetting();
			break;
		default:
			break;
		}
	}

	private void openSetting() {
		Intent intent = new Intent(this, SettingActivity.class);
		startActivity(intent);
	}

	// 登陆操作
	private void doLogin() {
		SharedPreferences sharedPreferences = PreferenceManager
				.getDefaultSharedPreferences(this);
		// 获取配置的服务器地址
		String server = sharedPreferences.getString(SettingActivity.KEY_SERVER,
				SettingActivity.DEFAULT_SERVER);
		// 获取配置的账号密码
		String authAccount = sharedPreferences.getString(
				SettingActivity.KEY_ACCOUNT, SettingActivity.DEFAULT_ACCOUNT);
		String authPswd = sharedPreferences.getString(SettingActivity.KEY_PSWD,
				SettingActivity.DEFAULT_PSWD);
		// 获取输入的昵称
		String nickName = mNicknameEditText.getText().toString();

		// 检查服务器地址是否为空
		if (TextUtils.isEmpty(server)) {
			VideoSDKHelper.getInstance().showToast(R.string.null_server);
			return;
		}
		// 检查账号密码是否为空
		if (TextUtils.isEmpty(authAccount)) {
			VideoSDKHelper.getInstance().showToast(R.string.null_account);
			return;
		}
		if (TextUtils.isEmpty(authPswd)) {
			VideoSDKHelper.getInstance().showToast(R.string.null_pswd);
			return;
		}
		// 检查昵称是否为空
		if (TextUtils.isEmpty(nickName)) {
			VideoSDKHelper.getInstance().showToast(R.string.null_nickname);
			return;
		}
		doLogin(server, authAccount, authPswd, nickName, nickName);

		// 登录过程中登录按钮不可用
		mLoginBtn.setClickable(false);
		mLoginBtn.setEnabled(false);
	}

	// 登陆操作
	private void doLogin(String server, String authAcnt, String authPswd,
			String nickName, String privAcnt) {
		// 设置服务器地址
		CloudroomVideoSDK.getInstance().setServerAddr(server);

		// 登录数据对象
		LoginDat loginDat = new LoginDat();
		// 昵称
		loginDat.nickName = nickName;
		// 第三方账号
		loginDat.privAcnt = privAcnt;
		// 登录账号，使用开通SDK的账号
		loginDat.authAcnt = authAcnt;
		// 登录密码必须做MD5处理
		loginDat.authPswd = authPswd;

		String cookie = mRadioGroup.getCheckedRadioButtonId() == R.id.btn_user ? "user"
				: "server";
		// 执行登录操作，可选坐席或者客户
		CloudroomVideoMgr.getInstance().login(loginDat, cookie);
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

	// 显示退出应用弹出框
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

}
