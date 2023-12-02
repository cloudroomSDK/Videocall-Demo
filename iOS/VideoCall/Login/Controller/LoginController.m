//
//  LoginController.m
//  VideoCall
//
//  Created by king on 2016/11/21.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "LoginController.h"
#import "SettingController.h"
#import "BaseNavController.h"
#import "CallHelper.h"
#import "AppDelegate.h"
#import "IQUIView+IQKeyboardToolbar.h"
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

typedef NS_ENUM(NSInteger, LoginBtnType)
{
    LoginBtnTypeCustomer = 1, // 客户
    LoginBtnTypeServer, // 客服
    LoginBtnTypeLogin, // 登录
    LoginBtnTypeSetting // 服务器设置
};

@interface LoginController () <CloudroomVideoMgrCallBack>

@property (weak, nonatomic) IBOutlet UILabel *versionLabel; /** 版本号< */
@property (weak, nonatomic) IBOutlet UITextField *nicknameTextField; /**< 昵称 */
@property (weak, nonatomic) IBOutlet UIButton *customerBtn; /**< 客户 */
@property (weak, nonatomic) IBOutlet UIButton *serverBtn; /**< 客服 */
@property (weak, nonatomic) IBOutlet UIButton *loginBtn;

@property (weak, nonatomic) IBOutlet UILabel *appVersionLab;
- (IBAction)clickBtnForLogin:(UIButton *)sender;

@end

@implementation LoginController
#pragma mark - life cycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self _setupUIForLogin];
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    
    if (!self.navigationController.navigationBarHidden) {
        [self.navigationController setNavigationBarHidden:YES animated:YES];
    }
    
    [self _updateDelegate];
}

- (void)dealloc
{
    VCLog(@"");
}

#pragma mark - CloudroomVideoMgrCallBack
- (void)loginSuccess:(NSString *)usrID cookie:(NSString *)cookie
{
    [HUDUtil hudHiddenProgress:YES];
    [self _jumpToDetailScreen];
}

- (void)loginFail:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    [HUDUtil hudHiddenProgress:YES];
    
    //FIXME:概率性登录卡死不回调 added by king 20161216
    if (sdkErr == CRVIDEOSDK_NOSERVER_RSP) {
        [HUDUtil hudShow:@"服务器无响应" delay:3 animated:YES];
    }
    else if (sdkErr == CRVIDEOSDK_LOGINSTATE_ERROR) {
        [HUDUtil hudShow:@"登陆状态不对" delay:3 animated:YES];
        [[CloudroomVideoMgr shareInstance] logout];
    }
    else if(sdkErr == CRVIDEOSDK_ANCTPSWD_ERR)
    {
        [HUDUtil hudShow:@"帐号密码不正确" delay:3 animated:YES];
    }
    else
    {
        [HUDUtil hudShow:@"登录失败" delay:3 animated:YES];
    }
}

#pragma mark - selector
/**
 按钮响应

 @param sender 按钮对象
 */
- (IBAction)clickBtnForLogin:(UIButton *)sender
{
    switch ([sender tag]) {
        case LoginBtnTypeCustomer:
        case LoginBtnTypeServer: { // 单选
            [self _handleSelectedOperation:sender];
            break;
        }
        case LoginBtnTypeLogin: { // 登录
            [self _handleLoginOperation];
            break;
        }
        case LoginBtnTypeSetting: { // 服务器设置
            [self _handleSetting];
            break;
        }
        default: break;
    }
}


/**
 键盘Tool视图按钮响应

 @param textView 文本视图
 */
- (void)hasDone:(UITextField *)textView
{
    [self.view endEditing:YES];
    [self clickBtnForLogin:_loginBtn];
}

#pragma mark - private method
/**
 初始化
 */
- (void)_setupUIForLogin
{
    [self _setupForProperies];
    [self _updateDelegate];
}

/**
 设置属性
 */
- (void)_setupForProperies
{
    NSInteger rolerID =  [[[[CallHelper shareInstance] settingInfo] objectForKey:roler] integerValue];
    if (rolerID == RolerTypeCustom) { // 客户
        [_customerBtn setSelected:YES];
        [_serverBtn setSelected:NO];
    }
    else if (rolerID == RolerTypeServer) { // 客服
        [_customerBtn setSelected:NO];
        [_serverBtn setSelected:YES];
    }
    
    // SDK版本号
    [_versionLabel setText:[NSString stringWithFormat:@"SDK版本号:%@",[CloudroomVideoSDK getCloudroomVideoSDKVer]]];
    
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    self.appVersionLab.text =  [infoDictionary objectForKey:@"CFBundleShortVersionString"];
    
    UIColor *color = [UIColor colorWithRed:77/255.0 green:94/255.0 blue:117/255.0 alpha:1.0];
    [_nicknameTextField setAttributedPlaceholder:[[NSAttributedString alloc] initWithString:@"请输入昵称" attributes:@{NSForegroundColorAttributeName: color}]];
//    [_nicknameTextField setCustomDoneTarget:self action:@selector(hasDone:)];
    
    [_loginBtn.layer setCornerRadius:4];
    [_loginBtn.layer masksToBounds];
    
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleLightContent];
    
    // TODO:保留登录信息 added by king 20170905
    CallHelper *callHelper = [CallHelper shareInstance];
    [callHelper readInfo];
    [_nicknameTextField setText:callHelper.nickname];
}

/**
 更新代理
 */
- (void)_updateDelegate
{
    CloudroomVideoMgr *cloudroomVideoMgr = [CloudroomVideoMgr shareInstance];
    [cloudroomVideoMgr setMgrCallback:self];
}


/**
 客户/客服

 @param sender 按钮对象
 */
- (void)_handleSelectedOperation:(UIButton *)sender
{
    VCLog(@"");
    
    if ([sender tag] == LoginBtnTypeCustomer) { // 客户
        [_customerBtn setSelected:YES];
        [_serverBtn setSelected:NO];
        [[[CallHelper shareInstance] settingInfo] setObject:@(RolerTypeCustom) forKey:roler];
    }
    else if ([sender tag] == LoginBtnTypeServer) { // 客服
        [_customerBtn setSelected:NO];
        [_serverBtn setSelected:YES];
        [[[CallHelper shareInstance] settingInfo] setObject:@(RolerTypeServer) forKey:roler];
    }
}

/**
 登录
 */
- (void)_handleLoginOperation
{
    VCLog(@"");
    
    NSString *nickname = _nicknameTextField.text;
    if ([NSString stringCheckEmptyOrNil:nickname]) {
        [HUDUtil hudShow:@"昵称不能为空!" delay:3 animated:YES];
        return;
    }
    
    CallHelper *callHelper = [CallHelper shareInstance];
    // 云屋SDK登陆账号,实际开发中,请联系云屋工作人员获取
    NSString *account = callHelper.account;
    // 密码通过MD5以后
    NSString *pswd = callHelper.pswd;
    // 服务器地址
    NSString *server = callHelper.server;
    
    if ([NSString stringCheckEmptyOrNil:account]) {
        [HUDUtil hudShow:@"账号不能为空!" delay:3 animated:YES];
        [self _handleSetting];
        return;
    }
    
    if ([NSString stringCheckEmptyOrNil:pswd]) {
        [HUDUtil hudShow:@"密码不能为空!" delay:3 animated:YES];
        [self _handleSetting];
        return;
    }
    
    if ([NSString stringCheckEmptyOrNil:server]) {
        [HUDUtil hudShow:@"服务器地址不能为空" delay:3 animated:YES];
        return;
    }
    
    NSString *md5Pswd = [NSString md5:callHelper.pswd];
    
    VCLog(@"server:%@ nickname:%@ account:%@ pswd:%@", server, nickname, account, md5Pswd);
    
    CloudroomVideoMgr *videoMgr = [CloudroomVideoMgr shareInstance];
    LoginDat *loginData = [[LoginDat alloc] init];
    [loginData setNickName:nickname];
    [loginData setAuthAcnt:account];
    [loginData setAuthPswd:md5Pswd];
    [loginData setPrivAcnt:nickname];
    
    [callHelper writeAccount:account pswd:pswd server:server];
    [callHelper writeNickname:nickname];
    
    NSString *cookie = [NSString stringWithFormat:@"%f",CFAbsoluteTimeGetCurrent()];
    // 设置服务器地址
    [[CloudroomVideoSDK shareInstance] setServerAddr:server];
    [HUDUtil hudShowProgress:@"正在登录中..." animated:YES];
    
    [self _updateDelegate];
    
    // 发送"登录"命令
    [videoMgr login:loginData cookie:cookie];
}

- (void)_handleSetting
{
    VCLog(@"");
    
    [self _jumpToSetting];
}

/**
 跳转到"详情"界面
 */
- (void)_jumpToDetailScreen
{
    VCLog(@"");
    
    CallHelper *callHelper = [CallHelper shareInstance];
    NSInteger rolerID = [[callHelper.settingInfo objectForKey:roler] integerValue];
    
    if (rolerID == RolerTypeCustom) { // 客户
        UIStoryboard *customer = [UIStoryboard storyboardWithName:@"Customer" bundle:nil];
        BaseNavController *customerNav =  [customer instantiateInitialViewController];
        
        if (customerNav) {
            [[[[UIApplication sharedApplication] delegate] window] setRootViewController:customerNav];
        }
    }
    else if (rolerID == RolerTypeServer) { // 客服
        UIStoryboard *server = [UIStoryboard storyboardWithName:@"Server" bundle:nil];
        BaseController *serverNav =  [server instantiateInitialViewController];
        
        if (serverNav) {
            [[[[UIApplication sharedApplication] delegate] window] setRootViewController:serverNav];
        }
    }
}

/**
 跳转到"服务器设置"界面
 */
- (void)_jumpToSetting
{
    VCLog(@"");
    
    UIStoryboard *login = [UIStoryboard storyboardWithName:@"Login" bundle:nil];
    SettingController *settingVC =  [login instantiateViewControllerWithIdentifier:@"SettingController"];
    
    if (settingVC) {
        [self.navigationController pushViewController:settingVC animated:YES];
    }
}

#pragma mark - override
// FIXME:点击界面任意空白地方收起键盘
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    UITouch *touch = [touches anyObject];
    
    if (touch.view == self.view) {
        [self.view endEditing:YES];
    }
}
@end
