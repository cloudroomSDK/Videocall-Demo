//
//  CustomerController.m
//  VideoCall
//
//  Created by king on 2016/11/23.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "CustomerController.h"
#import "ConversationController.h"
#import "BaseNavController.h"
#import "BaseController.h"
#import "CustomerCell.h"
#import "ServiceModel.h"
#import "AppDelegate.h"
#import "NSTimer+JKBlocks.h"
#import "CallHelper.h"
#import "TimeUtil.h"
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

typedef NS_ENUM(NSInteger, ConversationBarBtnType)
{
    ConversationBarBtnTypelogout = 1,
    ConversationBarBtnTypeRefresh
};

@interface CustomerController () <CloudroomQueueCallBack, CloudroomVideoMgrCallBack>

@property (nonatomic, copy) NSArray<ServiceModel *> *dataSource; /**< 数据源 */
@property (nonatomic, strong) UIAlertController *alertController; /**< 提示框 */
@property (nonatomic, strong) NSTimer *alertTimer; /**< 定时器 */
@property (nonatomic, assign) NSInteger alertCount; /**< 排队计时 */
@property (nonatomic, assign) NSInteger alertPosition; /**< 排队位置 */
@property (nonatomic, strong) NSString *callID;
@property (nonatomic, copy) NSString *peerID;
@property (nonatomic, strong) MeetInfo *meetInfo;
@property (nonatomic, assign) int queID;

- (IBAction)clickBarBtnForCustomer:(UIBarButtonItem *)sender;

@end

@implementation CustomerController
#pragma mark - life cycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self _setupForCustomer];
}

- (void)viewWillAppear:(BOOL)animated
{
    VCLog(@"");
    [super viewWillAppear:animated];
    
    // FIXME:再次进入界面无响应问题 added by king 201710101355
    [self _updateDelegate];
    
    // 刷新队列信息
    [self _handleRefreshOperation];
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
    CustomerCell *cell = [tableView dequeueReusableCellWithIdentifier:customer_ID];
    [self _configureCell:cell rowAtIndexPath:indexPath];
    return cell;
}

#pragma mark - UITableViewDelegate
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(nonnull NSIndexPath *)indexPath
{
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
    
    ServiceModel *serviceModel = [_dataSource objectAtIndex:indexPath.section];
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    int queID = serviceModel.queueInfo.queID;
    _queID = queID;
    _alertCount = 0;
    _alertPosition = 0;
    // 展示排队信息
    [self _showQueuingAlert];
    // 1. 开始排队(回调:queueCallBack:startQueuingRslt:cookie:/queueCallBack:stopQueuingRslt:cookie:)
    [[CloudroomQueue shareInstance] startQueuing:queID cookie:cookie];
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
// 初始化结果(初始化成功:errCode为CRVIDEOSDK_NOERR)
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
        
        // 检查是否有正在排队
        QueuingInfo *queuingInfo = [[CloudroomQueue shareInstance] getQueuingInfo];
        if (queuingInfo.queID > 0) {
            VCLog(@"queID:%d, queuingTime:%d, position:%d", queuingInfo.queID, queuingInfo.queuingTime, queuingInfo.position);
            _queID = queuingInfo.queID;
            _alertCount = (NSInteger)queuingInfo.queuingTime;
            _alertPosition = (NSInteger)queuingInfo.position - 1;
            [self _showQueuingAlert];
        }
        
        // 恢复意外关闭的视频会话
        VideoSessionInfo *sessionInfo = [videoCallQueue getSessionInfo];
        if (![NSString stringCheckEmptyOrNil:sessionInfo.callID] && sessionInfo.duration > 0) {
            UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"温馨提示:" message:@"是否恢复意外关闭的视频会话?" preferredStyle:UIAlertControllerStyleAlert];
            UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:^(UIAlertAction * _Nonnull action) {
                NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
                [[CloudroomVideoMgr shareInstance] hungupCall:sessionInfo.callID usrExtDat:nil cookie:cookie];
            }];
            UIAlertAction *doneAction = [UIAlertAction actionWithTitle:@"恢复" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
                _meetInfo = [[MeetInfo alloc] init];
                [_meetInfo setID:sessionInfo.meetingID];
                _peerID = sessionInfo.peerID;
                _callID = sessionInfo.callID;
                [self _jumpToConversation];
            }];
            [alertController addAction:cancelAction];
            [alertController addAction:doneAction];
            [self presentViewController:alertController animated:NO completion:nil];
        }
    }
    else {
        VCLog(@"客户界面获取数据错误!");
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
    
    [self.tableView reloadData];
}

// 排队信息变化通知
- (void)queuingInfoChanged:(QueuingInfo *)queuingInfo
{
    // FIXME:刷新排队信息
    [self _handleRefreshOperation];
    
    VCLog(@"queID:%d, queuingTime:%d, position:%d", queuingInfo.queID, queuingInfo.queuingTime, queuingInfo.position);
    QueuingInfo *queuing = [[CloudroomQueue shareInstance] getQueuingInfo];
    VCLog(@"queID:%d, queuingTime:%d, position:%d", queuing.queID, queuing.queuingTime, queuing.position);
    
    if (queuing.queID == -1 && _alertController) {
        [self _dismissQueuingAlert];
        return;
    }
    
    if (queuing.queID != _queID) {
        return;
    }
    
    if (!_alertController) {
        return;
    }
    
    _alertCount = (NSInteger)queuing.queuingTime;
    _alertPosition = (NSInteger)(queuing.position - 1);
}

// 开始排队结果
- (void)startQueuingRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;
{
    if (errCode != CRVIDEOSDK_NOERR) {
        [HUDUtil hudShow:@"排队失败" delay:3 animated:YES];
    }
}

// 停止排队结果
- (void)stopQueuingRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    if (errCode != CRVIDEOSDK_NOERR) {
        [HUDUtil hudShow:@"停止排队失败" delay:3 animated:YES];
    }
}

#pragma mark - CloudroomVideoMgrCallBack
// 4. 接受他人邀请响应
- (void)acceptCallSuccess:(NSString *)callID cookie:(NSString *)cookie
{
    VCLog(@"接受他人邀请响应, callID:%@", callID);
    // 进入视频会话
    _callID = callID;
    
    // 跳转到"回话"界面
    [self _jumpToConversation];
}

- (void)acceptCallFail:(NSString *)callID errCode:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    // ...
}

// 2. 服务端通知被邀请
- (void)notifyCallIn:(NSString *)callID meetInfo:(MeetInfo *)meetInfo callerID:(NSString *)callerID usrExtDat:(NSString *)usrExtDat
{
    VCLog(@"通知呼入, callID:%@", callID);
    _queID = 0;
    _callID = callID;
    _peerID = callerID;
    _meetInfo = meetInfo;
    [self _dismissQueuingAlert];
    
    NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
    // 3. 接受呼叫
    [[CloudroomVideoMgr shareInstance] acceptCall:callID meetInfo:meetInfo usrExtDat:nil cookie:cookie];
}

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

#pragma mark - selector
/**
 UIButton响应

 @param sender 按钮对象
 */
- (void)clickBtnForCustomer:(UIButton *)sender
{
    [self _handleLogoutOperation];
}

/**
 UIBarButtonItem响应

 @param sender 按钮对象
 */
- (IBAction)clickBarBtnForCustomer:(UIBarButtonItem *)sender
{
    switch ([sender tag]) {
        case ConversationBarBtnTypelogout: {
            [self _handleLogoutOperation];
            break;
        }
        case ConversationBarBtnTypeRefresh: {
            [self _handleRefreshOperation];
            break;
        }

        default: break;
    }
}

#pragma mark - private method
/**
 初始化
 */
- (void)_setupForCustomer
{
    [self _setupForProperies];
    [self _setupForTableView];
    [self _setupForTitle];
    [self _updateDelegate];
    [self _setupForQueue];
}

/**
 设置属性
 */
- (void)_setupForProperies
{
    _queID = 0;
}

/**
 初始化列表视图
 */
- (void)_setupForTableView
{
    [self.tableView setRowHeight:70];
    [self.tableView setTableFooterView:[UIView new]];
    [self.tableView setSeparatorColor:[UIColor clearColor]];
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
 初始化排队队列信息
 */
- (void)_setupForQueue
{
    NSString *cookie = [NSString stringWithFormat:@"%f",CFAbsoluteTimeGetCurrent()];
    CloudroomQueue *cloudroomQueue = [CloudroomQueue shareInstance];
    [cloudroomQueue setQueueCallback:self];
    // 发送"请求队列信息"命令
    [cloudroomQueue initQueueDat:cookie];
    
}

/**
 配置cell

 @param cell cell对象
 @param indexPath 行信息
 */
- (void)_configureCell:(CustomerCell *)cell rowAtIndexPath:(NSIndexPath *)indexPath
{
    ServiceModel *serviceModel = [_dataSource objectAtIndex:indexPath.section];
    //TODO:不要序号
    NSString *title = [NSString stringWithFormat:@"%@(%d)", serviceModel.queueInfo.name, serviceModel.queueStatus.wait_num];
    [cell.titleLabel setText:title];
    [cell.descLabel setText:serviceModel.queueInfo.desc];
}

/**
 更新代理
 */
- (void)_updateDelegate
{
    CloudroomQueue *cloudroomQueue = [CloudroomQueue shareInstance];
    [cloudroomQueue setQueueCallback:self];
    
    CloudroomVideoMgr *cloudroomVideoMgr = [CloudroomVideoMgr shareInstance];
    [cloudroomVideoMgr setMgrCallback:self];
    
}

/**
 注销
 */
- (void)_handleLogoutOperation
{
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
 跳转到"会话"界面
 */
- (void)_jumpToConversation
{
    if ([NSString stringCheckEmptyOrNil:_callID]) {
        VCLog(@"callID is empty!");
        return;
    }
    
    if ([NSString stringCheckEmptyOrNil:_peerID]) {
        VCLog(@"peerUserID is empty");
    }
    
    UIStoryboard *conversation = [UIStoryboard storyboardWithName:@"Conversation" bundle:nil];
    ConversationController *conversationVC = [conversation instantiateViewControllerWithIdentifier:@"ConversationController"];
    [conversationVC setCallID:_callID];
    [conversationVC setPeerID:_peerID];
    [conversationVC setMeetInfo:_meetInfo];
    [conversationVC setIsServer:NO];
    
    if (conversationVC) {
        [self.navigationController pushViewController:conversationVC animated:YES];
    }
}

/**
 跳转到"登录"界面
 */
- (void)_jumpToLogin
{
    // 注销
    [[CloudroomVideoMgr shareInstance] logout];
    
    // 跳转到"登录"界面
    UIStoryboard *login = [UIStoryboard storyboardWithName:@"Login" bundle:nil];
    BaseNavController *loginNav = [login instantiateInitialViewController];
    if (loginNav) {
        [[[[UIApplication sharedApplication] delegate] window] setRootViewController:loginNav];
    }
}


/**
 展示排队信息
 */
- (void)_showQueuingAlert
{
    [self _dismissQueuingAlert];
    
    weakify(self);
    NSString *message = @"正在初始化排队信息...";
    
    // 队列名称
    NSString *queName;
    for (ServiceModel *serviceModel in _dataSource) {
        if (serviceModel.queueInfo.queID == _queID) {
            queName = serviceModel.queueInfo.name;
            break;
        }
    }
    
    // 创建弹框
    _alertController = [UIAlertController alertControllerWithTitle:@"温馨提示:" message:message preferredStyle:UIAlertControllerStyleAlert];
    UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:^(UIAlertAction * _Nonnull action) {
        strongify(self);
        
        if (sSelf) {
            if (sSelf->_alertTimer) {
                [sSelf->_alertTimer invalidate];
            }
            
            sSelf->_alertCount = 0;
            sSelf->_queID = 0;
            NSString *cookie = [NSString stringWithFormat:@"%f", CFAbsoluteTimeGetCurrent()];
            [[CloudroomQueue shareInstance] stopQueuing:cookie];
            sSelf->_alertController = nil;
        }
    }];
    [_alertController addAction:cancelAction];
    [self presentViewController:_alertController animated:NO completion:nil];
    
    // 创建定时器
    _alertTimer = [NSTimer jk_scheduledTimerWithTimeInterval:1 block:^{
        strongify(self);
        if (sSelf) {
            sSelf->_alertCount++;
            [sSelf->_alertController setMessage:[NSString stringWithFormat:@"【%@】排队中,已等待时间:%@,您前面还有%zd人在等待", queName, [TimeUtil getFormatTimeString:sSelf->_alertCount], sSelf->_alertPosition]];
        }
    } repeats:YES];
}


/**
 清除排队弹框和定时器
 */
- (void)_dismissQueuingAlert
{
    // 清除弹框
    if (_alertController) {
        [_alertController dismissViewControllerAnimated:NO completion:nil];
        _alertController = nil;
    }
    
    // 清除定时器
    if (_alertTimer) {
        [_alertTimer invalidate];
        _alertTimer = nil;
        // 清楚相关计数
        _alertCount = 0;
        _alertPosition = 0;
    }
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
