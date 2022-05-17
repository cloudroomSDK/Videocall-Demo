//
//  QueueCallBack.m
//  VideoCall
//
//  Created by king on 2017/6/7.
//  Copyright © 2017年 CloudRoom. All rights reserved.
//

#import "QueueCallBack.h"

@implementation QueueCallBack
// 初始化结果（初始化成功:errCode为VCALLSDK_NOERR）
- (void)initQueueDatRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    VCLog(@"errCode:%d, cookie:%@", errCode, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:initQueueDatRslt:cookie:)]) {
            [_queueDelegate queueCallBack:self initQueueDatRslt:errCode cookie:cookie];
        }
    });
}

// 队列状态变化通知
- (void)queueStatusChanged:(QueueStatus *)queStatus
{
    VCLog(@"queID:%d", queStatus.queID);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:queueStatusChanged:)]) {
            [_queueDelegate queueCallBack:self queueStatusChanged:queStatus];
        }
    });
}

// 排队信息变化通知
- (void)queuingInfoChanged:(QueuingInfo *)queuingInfo
{
    VCLog(@"queID:%d position:%d queuingTime:%d", queuingInfo.queID, queuingInfo.position, queuingInfo.queuingTime);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:queuingInfoChanged:)]) {
            [_queueDelegate queueCallBack:self queuingInfoChanged:queuingInfo];
        }
    });
}

// 开始排队结果
- (void)startQueuingRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    VCLog(@"errCode:%d, cookie:%@", errCode, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:startQueuingRslt:cookie:)]) {
            [_queueDelegate queueCallBack:self startQueuingRslt:errCode cookie:cookie];
        }
    });
}

// 停止排队结果
- (void)stopQueuingRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    VCLog(@"errCode:%d, cookie:%@", errCode, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:stopQueuingRslt:cookie:)]) {
            [_queueDelegate queueCallBack:self stopQueuingRslt:errCode cookie:cookie];
        }
    });
}

// 开始服务某个队列
- (void)startServiceRslt:(int)queID errCode:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    VCLog(@"queID:%d, errCode:%d, cookie:%@", queID, errCode, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:startServiceRslt:errCode:cookie:)]) {
            [_queueDelegate queueCallBack:self startServiceRslt:queID errCode:errCode cookie:cookie];
        }
    });
}

// 停止服务某个队列
- (void)stopServiceRslt:(int)queID errCode:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    VCLog(@"queID:%d, errCode:%d, cookie:%@", queID, errCode, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:stopServiceRslt:errCode:cookie:)]) {
            [_queueDelegate queueCallBack:self stopServiceRslt:queID errCode:errCode cookie:cookie];
        }
    });
}

// 拒绝、接受分配的用户
- (void)responseAssignUserRslt:(CRVIDEOSDK_ERR_DEF)errCode cookie:(NSString *)cookie
{
    VCLog(@"errCode:%d, cookie:%@",errCode, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:responseAssignUserRslt:cookie:)]) {
            [_queueDelegate queueCallBack:self responseAssignUserRslt:errCode cookie:cookie];
        }
    });
}

// 服务器自动安排客户
- (void)autoAssignUser:(UserInfo *)usr
{
    VCLog(@"usr:%@", usr);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:autoAssignUser:)]) {
            [_queueDelegate queueCallBack:self autoAssignUser:usr];
        }
    });
}

// 请求分配客户结果
- (void)reqAssignUserRslt:(CRVIDEOSDK_ERR_DEF)errCode userInfo:(UserInfo *)usr cookie:(NSString*)cookie
{
    VCLog(@"errCode:%d, usr:%@, cookie:%@", errCode, usr, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:reqAssignUserRslt:userInfo:cookie:)]) {
            [_queueDelegate queueCallBack:self reqAssignUserRslt:errCode userInfo:usr cookie:cookie];
        }
    });
}

// 服务器撤消了安排的客户(如:座席超时未与分配的客户建议通话）
- (void)cancelAssignUser:(int)queID usrID:(NSString *)usrID
{
    VCLog(@"queID:%d, usrID:%@", queID, usrID);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_queueDelegate respondsToSelector:@selector(queueCallBack:cancelAssignUser:usrID:)]) {
            [_queueDelegate queueCallBack:self cancelAssignUser:queID usrID:usrID];
        }
    });
}
@end
