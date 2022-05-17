//
//  AppDelegate.m
//  VideoCall
//
//  Created by king on 2016/11/21.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

/* 配色:
 red:255 85 95(FF555F)
 blue:48 153 251(3099FB)
 gray:241 241 241(F1F1F1)
 bg:33 46 65(212E41)
 line:62 73 90(3E495A)
 placeholder:77 94 117(4D5E75)
 */

#import "AppDelegate.h"
#import "CallHelper.h"
#import "IQKeyboardManager.h"
#import "PathUtil.h"
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>
#import <Bugly/Bugly.h>

@interface AppDelegate ()
@property (nonatomic,assign) UIBackgroundTaskIdentifier backgroundTask;
@property (nonatomic,assign) BOOL backgroundTimeOut;
@property(nonatomic,strong)NSTimer *resetTimer;
@end

@implementation AppDelegate
#pragma mark - UIApplicationDelegate
// 启动完成
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    VCLog(@"");
    [self _setupConfigure];
    [Bugly startWithAppId:@"1f5c893034"];
   
    return YES;
}

// 失去焦点
- (void)applicationWillResignActive:(UIApplication *)application
{
    VCLog(@"applicationWillResignActive");
    self.backgroundTimeOut = NO;
    self.backgroundTask = [[UIApplication sharedApplication] beginBackgroundTaskWithName:@"VideoCall" expirationHandler:^{
        self.backgroundTimeOut = YES;
        VCLog(@"applicationWillResignActive backgroundTimeOut");
        if(self.backgroundTask != UIBackgroundTaskInvalid) {
            [[UIApplication sharedApplication] endBackgroundTask:self.backgroundTask];
        }
        self.backgroundTask = UIBackgroundTaskInvalid;
    }];
}

// 进入后台
- (void)applicationDidEnterBackground:(UIApplication *)application
{
    VCLog(@"applicationDidEnterBackground");
}

// 进入前台
- (void)applicationWillEnterForeground:(UIApplication *)application
{
    VCLog(@"applicationWillEnterForeground");
    if(self.backgroundTask != UIBackgroundTaskInvalid) {
        [[UIApplication sharedApplication] endBackgroundTask:self.backgroundTask];
    }
    self.backgroundTask = UIBackgroundTaskInvalid;
}

// 获取焦点
- (void)applicationDidBecomeActive:(UIApplication *)application
{
    VCLog(@"applicationDidBecomeActive");
    [self.resetTimer invalidate];
    if(self.backgroundTimeOut) {
        self.resetTimer = [NSTimer scheduledTimerWithTimeInterval:0.1 target:self selector: @selector(resetConnect) userInfo:nil repeats:false];
    }
}

-(void)resetConnect
{
    NSLog(@"resetConnect");
    
}

// 退出程序
- (void)applicationWillTerminate:(UIApplication *)application
{
    VCLog(@"");
	// TODO: 防止"会议"界面直接结束,导致系统异常横屏 added by king 20180605
    [self _orientationPortrait];
}

#pragma mark - private method
- (void)_setupConfigure
{
    [self _setupForStatusBar];
    [self _setupForVideoCallSDK];
    [self _setupForIQKeyboard];
}

- (void)_setupForStatusBar
{
    [[UIApplication sharedApplication] setStatusBarHidden:NO];
}

- (void)_setupForVideoCallSDK
{
    CallHelper *callHelper = [CallHelper shareInstance];
    [callHelper readInfo];
    
    if ([NSString stringCheckEmptyOrNil:callHelper.account] ||
        [NSString stringCheckEmptyOrNil:callHelper.pswd] ||
        [NSString stringCheckEmptyOrNil:callHelper.server]) {
        [callHelper resetInfo];
    }
    
    // FIXME:WARNING: QApplication was not created in the main() thread.QObject::connect: No such slot MeetRecordImpl::slot_SetScreenShare(bool)
    SdkInitDat *sdkInitData = [[SdkInitDat alloc] init];
    [sdkInitData setSdkDatSavePath:[PathUtil searchPathInCacheDir:@"CloudroomVideoSDK"]];
    [sdkInitData setShowSDKLogConsole:NO];
    [sdkInitData.params setValue:@"0" forKey:@"HttpDataEncrypt"];
    CRVIDEOSDK_ERR_DEF error = [[CloudroomVideoSDK shareInstance] initSDK:sdkInitData];
    
    if (error != CRVIDEOSDK_NOERR) {
        VCLog(@"VideoCallSDK init error!");
        [[CloudroomVideoSDK shareInstance] uninit];
    }
    
    NSLog(@"GetVideoCallSDKVer:%@", [CloudroomVideoSDK getCloudroomVideoSDKVer]);
}

// FIXME:修改键盘ToolBar按钮标题
- (void)_setupForIQKeyboard
{
    [[IQKeyboardManager sharedManager] setToolbarDoneBarButtonItemText:@"完成"];
}



/** 强制竖屏 */
- (void)_orientationPortrait {
    NSNumber *value = [NSNumber numberWithInt:UIInterfaceOrientationPortrait];
    [[UIDevice currentDevice] setValue:value forKey:@"orientation"];
}
@end
