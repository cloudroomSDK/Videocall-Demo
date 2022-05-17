//
//  QueueCallBack.h
//  VideoCall
//
//  Created by king on 2017/6/7.
//  Copyright © 2017年 CloudRoom. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

@class QueueCallBack;

@protocol QueueDelegate <NSObject>

@optional
// 初始化结果（初始化成功:errCode为VCALLSDK_NOERR）
- (void)queueCallBack:(QueueCallBack *)callback initQueueDatRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;

// 队列状态变化通知
- (void)queueCallBack:(QueueCallBack *)callback queueStatusChanged:(QueueStatus *)queStatus;

// 排队信息变化通知
- (void)queueCallBack:(QueueCallBack *)callback queuingInfoChanged:(QueuingInfo *)queuingInfo;

// 开始排队结果
- (void)queueCallBack:(QueueCallBack *)callback startQueuingRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;

// 停止排队结果
- (void)queueCallBack:(QueueCallBack *)callback stopQueuingRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;

// 开始服务某个队列
- (void)queueCallBack:(QueueCallBack *)callback startServiceRslt:(int)queID errCode:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;

// 停止服务某个队列
- (void)queueCallBack:(QueueCallBack *)callback stopServiceRslt:(int)queID errCode:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;

// 拒绝、接受分配的用户
- (void)queueCallBack:(QueueCallBack *)callback responseAssignUserRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie;

// 服务器自动安排客户
- (void)queueCallBack:(QueueCallBack *)callback autoAssignUser:(UserInfo *)usr;

// 请求分配客户结果
- (void)queueCallBack:(QueueCallBack *)callback reqAssignUserRslt:(CRVIDEOSDK_ERR_DEF)errCode userInfo:(UserInfo *)usr cookie:(NSString*)cookie;

// 服务器撤消了安排的客户(如:座席超时未与分配的客户建议通话）
- (void)queueCallBack:(QueueCallBack *)callback cancelAssignUser:(int)queID usrID:(NSString *)usrID;

@end

@interface QueueCallBack : NSObject <CloudroomQueueCallBack>

@property (nonatomic, weak) id <QueueDelegate> queueDelegate;

@end
