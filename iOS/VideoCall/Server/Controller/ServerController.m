//
//  ServerController.m
//  VideoCall
//
//  Created by king on 2016/11/23.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "ServerController.h"
#import "BaseNavController.h"
#import "ConversationController.h"
#import "ServerCell.h"
#import "AppDelegate.h"
#import "ServiceModel.h"
#import "CallHelper.h"
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

typedef NS_ENUM(NSInteger, ServerBtnType)
{
    ServerBtnTypeAuto = 1,
    ServerBtnTypeNext
};

typedef NS_ENUM(NSInteger, ServerBarBtnType)
{
    ServerBarBtnTypeLogout = 1,
    ServerBarBtnTypeRefresh
};

@interface ServerController () <UITableViewDelegate, UITableViewDataSource, CloudroomQueueCallBack, CloudroomVideoMgrCallBack>

@property (weak, nonatomic) IBOutlet UITableView *tableView; /**< 列表 */
@property (weak, nonatomic) IBOutlet UIButton *autoBtn; /**< 系统自动分配 */
@property (weak, nonatomic) IBOutlet UIButton *nextBtn; /**< 下一位 */
@property (nonatomic, copy) NSArray<ServiceModel *> *dataSource; /**< 数据源 */
@property (nonatomic, strong) UIAlertController *alertController; /**< 提示框 */
@property (nonatomic, strong) MeetInfo *meetInfo;
@property (nonatomic, copy) NSString *peerID; /**< 对端ID */

- (IBAction)clickBtnForServer:(UIButton *)sender;
- (IBAction)clickBarBtnForServer:(UIBarButtonItem *)sender;

@end

@implementation ServerController
#pragma mark - life cycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self _setupForServer];
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    
    // FIXME:再次进入界面无响应问题 added by king 201710101357
    [self _updateDelegate];
}

- (void)dealloc
{
    VCLog(@"");
}

#pragma mark - UITableViewDataSource
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return [_dataSource count];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return 1;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    ServerCell *cell = [tableView dequeueReusableCellWithIdentifier:server_ID];
    [self _configureCell:cell rowAtIndexPath:indexPath];
    return cell;
}

#pragma mark - UITableViewDelegate
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
    
    //TODO:点击整行cell也可以开启/停止服务 added by king 20161213
    ServerCell *cell = [tableView cellForRowAtIndexPath:indexPath];
    [cell clickBtnForServer:cell.serverBtn];
}

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
    return 12;
}

- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section
{
    return 0;
}

#pragma mark - CloudroomQueueCallBack
// 初始化结果
- (void)initQueueDatRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    if (errCode == CRVIDEOSDK_NOERR) {
        CloudroomQueue *videoCallQueue = [CloudroomQueue shareInstance];
        NSMutableArray<QueueInfo *> *queueInfoArr = [videoCallQueue getQueueInfo];
        NSMutableArray<NSNumber *> *serviceQueueArr = [videoCallQueue getServiceQueues];
        NSMutableArray<ServiceModel *> *result = [NSMutableArray array];
        
        for (QueueInfo *queueInfo in queueInfoArr) {
            ServiceModel *serviceModel = [[ServiceModel alloc] init];
            QueueStatus *queueStatus = [videoCallQueue getQueueStatus:queueInfo.queID];
            serviceModel.queueInfo = queueInfo;
            serviceModel.queueStatus = queueStatus;
            serviceModel.serviced = [serviceQueueArr containsObject:@(queueInfo.queID)];
            [result addObject:serviceModel];
        }
        _dataSource = [result copy];
        [self.tableView reloadData];
        
        // 恢复意外关闭的视频会话
        VideoSessionInfo *sessionInfo = [videoCallQueue getSessionInfo];
        VCLog(@"callID:%@ duration:%d", sessionInfo.callID, sessionInfo.duration);
        if (![NSString stringCheckEmptyOrNil:sessionInfo.callID] && sessionInfo.duration > 0) {
            UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"温馨提示:" message:@"是否恢复意外关闭的视频会话?" preferredStyle:UIAlertControllerStyleAlert];
            UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:^(UIAlertAction * _Nonnull action) {
                NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
                [[CloudroomVideoMgr shareInstance] hangupCall:sessionInfo.callID usrExtDat:nil cookie:cookie];
            }];
            UIAlertAction *doneAction = [UIAlertAction actionWithTitle:@"恢复" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
                _meetInfo = [[MeetInfo alloc] init];
                [_meetInfo setID:sessionInfo.meetingID];
                _peerID = sessionInfo.peerID;
                [self _jumpToConversationWithCallID:sessionInfo.callID meetInfo:_meetInfo];
            }];
            [alertController addAction:cancelAction];
            [alertController addAction:doneAction];
            [self presentViewController:alertController animated:NO completion:nil];
        }
    }
    else {
        VCLog(@"客服界面获取数据错误!");
    }
}

// 队列状态变化通知
- (void)queueStatusChanged:(QueueStatus *)queStatus
{
    for (NSInteger i = 0; i < [_dataSource count]; i++) {
        ServiceModel *serviceModel = _dataSource[i];
        
        if (serviceModel.queueStatus.queID == queStatus.queID) {
            serviceModel.queueStatus = queStatus;
        }
    }
    
    [_tableView reloadData];
}

// 排队信息变化通知
- (void)queuingInfoChanged:(QueuingInfo *)queuingInfo
{
    // ...
}

// 开始服务某个队列
- (void)startServiceRslt:(int)queID errCode:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    [HUDUtil hudHiddenProgress:YES];
    
    if (errCode == CRVIDEOSDK_NOERR) {
    }
    else {
        [HUDUtil hudShow:@"开启服务失败" delay:3 animated:YES];
        NSInteger index = 0;
        
        for (NSInteger i = 0; i < [_dataSource count]; i++) {
            ServiceModel *serviceModel = _dataSource[i];
            
            if (serviceModel.queueStatus.queID == queID) {
                index = i;
                serviceModel.serviced = NO;
                break;
            }
        }
        
        NSIndexPath *indexPath = [NSIndexPath indexPathForRow:index inSection:0];
        [_tableView reloadRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationNone];
    }
}

// 停止服务某个队列
- (void)stopServiceRslt:(int)queID errCode:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    [HUDUtil hudHiddenProgress:YES];
    
    if (errCode == CRVIDEOSDK_NOERR) {
    }
    else {
        [HUDUtil hudShow:@"停止服务失败" delay:3 animated:YES];
        NSInteger index = 0;
        for (NSInteger i = 0; i < [_dataSource count]; i++) {
            ServiceModel *serviceModel = _dataSource[i];
            
            if (serviceModel.queueStatus.queID == queID) {
                index = i;
                serviceModel.serviced = YES;
                break;
            }
        }
        NSIndexPath *indexPath = [NSIndexPath indexPathForRow:index inSection:0];
        [_tableView reloadRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationNone];
    }
}

// 拒绝/接受分配的用户
- (void)responseAssignUserRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    if (errCode == CRVIDEOSDK_NOERR) {
        // ...
    }
}

// "系统自动分配"回调
- (void)autoAssignUser:(UserInfo *)usr
{
    [self _serviceUser:usr isAuto:YES];
}

// "手动请求分配"回调
- (void)reqAssignUserRslt:(CRVIDEOSDK_ERR_DEF)errCode userInfo:(UserInfo *)usr cookie:(NSString*)cookie
{
    if (errCode == CRVIDEOSDK_NOERR) {
        [self _serviceUser:usr isAuto:NO];
    }
    else if (errCode == CRVIDEOSDK_QUE_NOUSER) {
        [HUDUtil hudShow:@"没有用户在排队" delay:3 animated:YES];
    }
    else if (errCode == CRVIDEOSDK_QUE_SERVICE_NOT_START) {
        [HUDUtil hudShow:@"服务未开启" delay:3 animated:YES];
    }
}

// 服务器撤消了安排的客户(如:座席超时未与分配的客户建议通话）
- (void)cancelAssignUser:(int)queID usrID:(NSString *)usrID
{
    if (_alertController) {
        [_alertController dismissViewControllerAnimated:YES completion:nil];
        _alertController = nil;
    }
}

#pragma mark - CloudroomVideoMgrCallBack
// 掉线/被踢通知
- (void)lineOff:(CRVIDEOSDK_ERR_DEF)sdkErr
{
    if (sdkErr == CRVIDEOSDK_KICKOUT_BY_RELOGIN) { // 被踢
        [self _showAlert:@"您的帐号在别处被使用!"];
    }
    else { // 掉线
        [self _showAlert:@"您已掉线!"];
    }
}

// 创建会议
- (void)createMeetingSuccess:(MeetInfo *)meetInfo cookie:(NSString *)cookie
{
    [[CloudroomVideoMgr shareInstance] call:_peerID meetInfo:meetInfo param:nil cookie:cookie];
    //[[CloudroomVideoMgr shareInstance] callByMeetingID:_peerID meetInfo:meetInfo usrExtDat:nil cookie:cookie];
}

- (void)createMeetingFail:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    [HUDUtil hudShow:@"会议创建失败" delay:3 animated:YES];
}

// 客户端免打扰状态响应
- (void)setDNDStatusSuccess:(NSObject *)cookie
{
    [HUDUtil hudHiddenProgress:YES];
    
    if ([cookie isKindOfClass:[NSString class]]) {
        NSString *cookieStr = (NSString *)cookie;
        
        if ([cookieStr integerValue] == 0) {
            [HUDUtil hudShow:@"系统自动分配" delay:3 animated:YES];
        }
        else if ([cookieStr integerValue] == 1) {
            [HUDUtil hudShow:@"开启免打扰" delay:3 animated:YES];
        }
    }
}

- (void)setDNDStatusFail:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    [HUDUtil hudHiddenProgress:YES];
    [HUDUtil hudShow:@"设置免打扰状态失败" delay:3 animated:YES];
}

// 邀请他人参会响应
- (void)callSuccess:(NSString *)callID cookie:(NSString *)cookie
{
    // ...
    
}

- (void)callFail:(NSString *)callID errCode:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    // ...
}

// 服务端通知会议邀请被接受
- (void)notifyCallAccepted:(NSString *)callID meetInfo:(MeetInfo *)meetInfo usrExtDat:(NSString *)usrExtDat
{
    [self _enterMeetingWithCallID:callID meetInfo:meetInfo];
}

// 服务端通知会议邀请被拒绝
- (void)notifyCallRejected:(NSString *)callID reason:(CRVIDEOSDK_ERR_DEF)reason usrExtDat:(NSString *)usrExtDat
{
    // ...
}

#pragma mark - selector

/**
 UIButton响应

 @param sender 按钮对象
 */
- (IBAction)clickBtnForServer:(UIButton *)sender
{
    switch ([sender tag]) {
        case ServerBtnTypeAuto: { // 系统自动分配客户
            [self _handleAutoOperation:sender];
            break;
        }
        case ServerBtnTypeNext: { // 下一位客户
            [self _handleNextOperation];
            break;
        }
        default:
            break;
    }
}

/**
 UIBarButtonItem响应

 @param sender 按钮对象
 */
- (IBAction)clickBarBtnForServer:(UIBarButtonItem *)sender
{
    switch ([sender tag]) {
        case ServerBarBtnTypeLogout: {
            [self _handleLogoutOperation];
            break;
        }
            
        case ServerBarBtnTypeRefresh: {
            [self _handleRefreshOperation];
            break;
        }
        default:
            break;
    }
}


#pragma mark - private method
/**
 初始化
 */
- (void)_setupForServer
{
    [self _setupForProperies];
    [self _setupForTitle];
    [self _setupForTableView];
    [self _setupForVideoMgr];
    [self _updateDelegate];
    [self _setupForQueue];
}

/**
 设置属性
 */
- (void)_setupForProperies
{
    // 默认不自动分配
    [_autoBtn setSelected:NO];
    [_nextBtn setEnabled:YES];
}

/**
 初始化标题
 */
- (void)_setupForTitle
{
    NSString *title = [NSString stringWithFormat:@"%@,欢迎你!", [[CallHelper shareInstance] nickname]];
    [self setTitle:title];
}

/**
 初始化列表视图
 */
- (void)_setupForTableView
{
    [_tableView setTableFooterView:[UIView new]];
    [_tableView setRowHeight:160];
    [_tableView setSeparatorColor:[UIColor clearColor]];
}

/**
 初始化免打扰设置
 */
- (void)_setupForVideoMgr
{
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    CloudroomVideoMgr *videoMgr = [CloudroomVideoMgr shareInstance];
    // (0:代表关闭免打扰,其它值代表开启免打扰,含义可自由定义)
    [videoMgr setDNDStatus:1 cookie:cookie];
}

/**
 初始化排队列表信息
 */
- (void)_setupForQueue
{
    CloudroomQueue *cloudroomQueue = [CloudroomQueue shareInstance];
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    [cloudroomQueue setQueueCallback:self];
    // 发送"请求队列信息"命令
    [cloudroomQueue initQueueDat:cookie];
    /* 记录 QueueCallBack */

}

/**
 配置cell

 @param cell cell对象
 @param indexPath 行信息
 */
- (void)_configureCell:(ServerCell *)cell rowAtIndexPath:(NSIndexPath *)indexPath
{
    ServiceModel *serviceModel = [_dataSource objectAtIndex:indexPath.section];
    NSString *serviceTitle = serviceModel.isServiced ? @"停止服务此业务" : @"服务此业务";
    UIColor *nColor = [UIColor colorWithRed:255/255.0 green:85/255.0 blue:95/255.0 alpha:1.0];
    UIColor *sColor = [UIColor colorWithRed:48/255.0 green:153/255.0 blue:251/255.0 alpha:1.0];
    [cell.nameText setText:serviceModel.queueInfo.name];
    [cell.countText setText:[NSString stringWithFormat:@"%d", serviceModel.queueStatus.wait_num]];
    //TODO:需要添加"工作人员"和"正在进行" added by king 201612013
    [cell.serviceText setText:[NSString stringWithFormat:@"%d", serviceModel.queueStatus.agent_num]];
    [cell.servicingText setText:[NSString stringWithFormat:@"%d", serviceModel.queueStatus.srv_num]];
    [cell.serverBtn setTitle:serviceTitle forState:UIControlStateNormal];
    [cell.serverBtn setBackgroundColor:serviceModel.isServiced ? nColor : sColor];
    [cell.serverBtn.layer setCornerRadius:4];
    [cell.serverBtn.layer masksToBounds];
    
    weakify(self)
    [cell setBtnResponse:^(ServerCell *weakCell, UIButton *sender) {
        strongify(self)
        NSString *cookie = [NSString stringWithFormat:@"%f",CFAbsoluteTimeGetCurrent()];
        
        if (serviceModel.isServiced) { // 正在服务
            [HUDUtil hudShowProgress:@"正在停止服务..." animated:YES];
            [[CloudroomQueue shareInstance] stopService:serviceModel.queueInfo.queID cookie:cookie];
        }
        else {
            [HUDUtil hudShowProgress:@"正在开启服务..." animated:YES];
            // 设置坐席优先级 added by king 20180410
            [[CloudroomQueue shareInstance] startService:serviceModel.queueInfo.queID priority:5 cookie:cookie];
        }
        
        serviceModel.serviced = !serviceModel.serviced;
        [sSelf.tableView reloadRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationNone];
    }];
}

/**
 更新代理
 */
- (void)_updateDelegate
{
    CloudroomVideoMgr *cloudroomVideoMgr = [CloudroomVideoMgr shareInstance];
    [cloudroomVideoMgr setMgrCallback:self];
    
    CloudroomQueue *cloudroomQueue = [CloudroomQueue shareInstance];
    [cloudroomQueue setQueueCallback:self];

}

/**
 注销
 */
- (void)_handleLogoutOperation
{
    VCLog(@"");
    
    // 发送"注销"指令
    [[CloudroomVideoMgr shareInstance] logout];
    [self _jumpToLogin];

}
/**
 刷新
 */
- (void)_handleRefreshOperation
{
    VCLog(@"");
    
    [[CloudroomQueue shareInstance] refreshAllQueueStatus];
}

/**
 免打扰设置

 @param sender 按钮对象
 */
- (void)_handleAutoOperation:(UIButton *)sender
{
    VCLog(@"");
    
    CloudroomVideoMgr *videoMgr = [CloudroomVideoMgr shareInstance];
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];;
    sender.selected = !sender.selected;
    
    [HUDUtil hudShowProgress:nil animated:YES];
    
    if (sender.selected) { // 关闭免打扰
        [_nextBtn setEnabled:NO];
        [videoMgr setDNDStatus:0 cookie:cookie];
    }
    else { // 开启免打扰
        [_nextBtn setEnabled:YES];
        [videoMgr setDNDStatus:1 cookie:cookie];
    }
}

/**
 下一个客户(仅限免打扰)
 */
- (void)_handleNextOperation
{
    VCLog(@"");
    
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    // 请求分配一个客户(在免打扰状态下,系统不会自动分配,可以主动请求分配一个任务)
    [[CloudroomQueue shareInstance] reqAssignUser:cookie];
}

/**
 跳转到"会话"界面

 @param callID 会话ID
 @param meetInfo 会议信息
 */
- (void)_jumpToConversationWithCallID:(NSString *)callID meetInfo:(MeetInfo *)meetInfo
{
    VCLog(@"");
    
    UIStoryboard *conversation = [UIStoryboard storyboardWithName:@"Conversation" bundle:nil];
    ConversationController *conversationVC = [conversation instantiateViewControllerWithIdentifier:@"ConversationController"];
    [conversationVC setCallID:callID];
    [conversationVC setPeerID:_peerID];
    [conversationVC setMeetInfo:meetInfo];
    [conversationVC setIsServer:YES];
    
    if (conversationVC) {
        [self.navigationController pushViewController:conversationVC animated:YES];
    }
}

/**
 跳转到"登录"界面
 */
- (void)_jumpToLogin
{
    VCLog(@"");
    
    // 注销
    [[CloudroomVideoMgr shareInstance] logout];
    
    UIStoryboard *login = [UIStoryboard storyboardWithName:@"Login" bundle:nil];
    BaseNavController *loginNav = [login instantiateInitialViewController];
    if (loginNav) {
        [[[[UIApplication sharedApplication] delegate] window] setRootViewController:loginNav];
    }
}

- (void)_serviceUser:(UserInfo *)userInfo isAuto:(BOOL)isAuto
{
    NSString *userIDString = [NSString stringWithFormat:@"%@", userInfo.usrID];
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    NSString *message;
    
    if (isAuto) {
        VCLog(@"auto assign");
        message = [NSString stringWithFormat:@"系统自动为您分配用户:%@", userIDString];
        _alertController = [UIAlertController alertControllerWithTitle:@"温馨提示:" message:message preferredStyle:UIAlertControllerStyleAlert];
        UIAlertAction *rejectAction = [UIAlertAction actionWithTitle:@"拒绝" style:UIAlertActionStyleDestructive handler:^(UIAlertAction * _Nonnull action) {
            VCLog(@"reject auto assign");
            NSString *userIDString = [NSString stringWithFormat:@"%@", userInfo.usrID];
            [[CloudroomQueue shareInstance] rejectAssignUser:userInfo.queID userID:userIDString cookie:cookie];
        }];
        UIAlertAction *acceptAction = [UIAlertAction actionWithTitle:@"同意" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
            VCLog(@"accept auto assign");
            [[CloudroomQueue shareInstance] acceptAssignUser:userInfo.queID userID:userInfo.usrID cookie:cookie];
            [self _callUser:userInfo];
        }];
        [_alertController addAction:rejectAction];
        [_alertController addAction:acceptAction];
        [self presentViewController:_alertController animated:YES completion:^{}];
    }
    else {
        VCLog(@"manual assign");
        [[CloudroomQueue shareInstance] acceptAssignUser:userInfo.queID userID:userInfo.usrID cookie:cookie];
        [self _callUser:userInfo];
    }
}

- (void)_callUser:(UserInfo *)userInfo
{
    if ([NSString stringCheckEmptyOrNil:userInfo.usrID]) {
        VCLog(@"usrID is empty!");
        return;
    }
    
    _peerID = userInfo.usrID;
    
    VCLog(@"usrID:%@", userInfo.usrID);
    
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    // 创建会议
    [[CloudroomVideoMgr shareInstance] createMeeting:cookie];
}

- (void)_enterMeetingWithCallID:(NSString *)callID meetInfo:(MeetInfo *)meetInfo
{
    VCLog(@"");
    [self _jumpToConversationWithCallID:callID meetInfo:meetInfo];
}

- (void)_showAlert:(NSString *)message
{
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"温馨提示:" message:message preferredStyle:UIAlertControllerStyleAlert];
    UIAlertAction *doneAction = [UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        [self _jumpToLogin];
    }];
    [alertController addAction:doneAction];
    [self presentViewController:alertController animated:YES completion:^{}];
}
@end
