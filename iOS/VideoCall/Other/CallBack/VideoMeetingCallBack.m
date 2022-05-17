//
//  VideoMeetingCallBack.m
//  VideoCall
//
//  Created by king on 2017/6/7.
//  Copyright © 2017年 CloudRoom. All rights reserved.
//

#import "VideoMeetingCallBack.h"

@interface VideoMeetingCallBack ()

@end

@implementation VideoMeetingCallBack
// 入会成功；(入会失败，将自动发起releaseCall）
- (void)enterMeetingRslt:(CRVIDEOSDK_ERR_DEF)code
{
    VCLog(@"code:%zd", code);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:enterMeetingRslt:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self enterMeetingRslt:code];
        }
    });
}

// user进入了会话
- (void)userEnterMeeting:(NSString *)userID
{
    VCLog(@"userID:%@", userID);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:userEnterMeeting:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self userEnterMeeting:userID];
        }
    });
}

- (void)userLeftMeeting:(NSString *)userID
{
    VCLog(@"userID:%@", userID);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:userLeftMeeting:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self userLeftMeeting:userID];
        }
    });
}

// 创建会议
- (void)createMeetingSuccess:(int)meetID password:(NSString *)password cookie:(NSString *)cookie
{
    VCLog(@"meetID:%zd password:%@ cookie:%@", meetID, password, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:createMeetingSuccess:password:cookie:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self createMeetingSuccess:meetID password:password cookie:cookie];
        }
    });
}

- (void)createMeetingFail:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    VCLog(@"sdkErr:%zd cookie:%@", sdkErr, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:createMeetingFail:cookie:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self createMeetingFail:sdkErr cookie:cookie];
        }
    });
}

// 结束会议的结果
- (void)endMeetingRslt:(CRVIDEOSDK_ERR_DEF)code
{
    VCLog(@"code:%zd", code);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:enterMeetingRslt:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self enterMeetingRslt:code];
        }
    });
}

// 会议被结束了
- (void)meetingStopped
{
    VCLog(@"");
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBackMeetingStopped:)]) {
            [_videoMeetingDelegate videoMeetingCallBackMeetingStopped:self];
        }
    });
}

// 会议掉线
- (void)meetingDropped
{
    VCLog(@"");
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBackMeetingDropped:)]) {
            [_videoMeetingDelegate videoMeetingCallBackMeetingDropped:self];
        }
    });
}

// 最新网络评分0~10(10分为最佳网络)
-(void)netStateChanged:(int)level
{
    VCLog(@"level:%d", level);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:netStateChanged:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self netStateChanged:level];
        }
    });
}

// 麦声音强度更新(level取值0~10)
- (void)micEnergyUpdate:(NSString *)userID oldLevel:(int)oldLevel newLevel:(int)newLevel
{
    VCLog(@"userID:%@ oldLevel:%d newLevel:%d", userID, oldLevel, newLevel);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:micEnergyUpdate:oldLevel:newLevel:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self micEnergyUpdate:userID oldLevel:oldLevel newLevel:newLevel];
        }
    });
}

// 本地音频设备有变化
- (void)audioDevChanged
{
    VCLog(@"");
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBackAudioDevChanged:)]) {
            [_videoMeetingDelegate videoMeetingCallBackAudioDevChanged:self];
        }
    });
}

// 音频设备状态变化
- (void)audioStatusChanged:(NSString *)userID oldStatus:(AUDIO_STATUS)oldStatus newStatus:(AUDIO_STATUS)newStatus
{
    VCLog(@"userID:%@ oldStatus:%d newStatus:%d", userID, oldStatus, newStatus);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:audioStatusChanged:oldStatus:newStatus:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self audioStatusChanged:userID oldStatus:oldStatus newStatus:newStatus];
        }
    });
}

// 视频设备状态变化
- (void)videoStatusChanged:(NSString *)userID oldStatus:(VIDEO_STATUS)oldStatus newStatus:(VIDEO_STATUS)newStatus
{
    VCLog(@"userID:%@ oldStatus:%d newStatus:%d", userID, oldStatus, newStatus);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:videoStatusChanged:oldStatus:newStatus:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self videoStatusChanged:userID oldStatus:oldStatus newStatus:newStatus];
        }
    });
}

- (void)openVideoRslt:(NSString *)devID success:(BOOL)bSuccess
{
    VCLog(@"bSuccess:%zd", bSuccess);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:openVideoRslt:success:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self openVideoRslt:devID success:bSuccess];
        }
    });
}

// 成员有新的视频图像数据到来(通过GetVideoImg获取）
- (void)notifyVideoData:(UsrVideoId *)userID frameTime:(long)frameTime
{
    // VCLog(@"userID.userId:%@ userID.videoID:%d frameTime:%ld", userID.userId, userID.videoID, frameTime);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyVideoData:frameTime:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyVideoData:userID frameTime:frameTime];
        }
    });
}

// 本地视频设备有变化
- (void)videoDevChanged:(NSString *)userID
{
    VCLog(@"userID:%@", userID);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:videoDevChanged:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self videoDevChanged:userID];
        }
    });
}

- (void)defVideoChanged:(NSString *)userID videoID:(short)videoID
{
    VCLog(@"userID:%@ videoID:%d", userID, videoID);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:defVideoChanged:videoID:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self defVideoChanged:userID videoID:videoID];
        }
    });
}

// 屏幕共享操作通知
- (void)notifyScreenShareStarted
{
    VCLog(@"");
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBackNotifyScreenShareStarted:)]) {
            [_videoMeetingDelegate videoMeetingCallBackNotifyScreenShareStarted:self];
        }
    });
}

- (void)notifyScreenShareStopped
{
    VCLog(@"");
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBackNotifyScreenShareStopped:)]) {
            [_videoMeetingDelegate videoMeetingCallBackNotifyScreenShareStopped:self];
        }
    });
}

// 屏幕共享数据更新,用户收到该回调消息后应该调用getShareScreenDecodeImg获取最新的共享数据
- (void)notifyScreenShareData:(NSString *)userID changedRect:(CGRect)changedRect frameSize:(CGSize)size
{
//    VCLog(@"userID:%@ changedRect:%@ size:%@", userID, NSStringFromCGRect(changedRect), NSStringFromCGSize(size));
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyScreenShareData:changedRect:frameSize:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyScreenShareData:userID changedRect:changedRect frameSize:size];
        }
    });
}

// IM消息发送结果
- (void)sendIMmsgRlst:(NSString *)taskID sdkErr:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie
{
    VCLog(@"taskID:%@ sdkErr:%zd cookie:%@", taskID, sdkErr, cookie);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:sendIMmsgRlst:sdkErr:cookie:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self sendIMmsgRlst:taskID sdkErr:sdkErr cookie:cookie];
        }
    });
}

// 通知收到文本消息
- (void)notifyIMmsg:(NSString *)romUserID text:(NSString *)text sendTime:(int)sendTime
{
    VCLog(@"romUserID:%@ text:%@", romUserID, text);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyIMmsg:text:sendTime:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyIMmsg:romUserID text:text sendTime:sendTime];
        }
    });
}

// 影音开始通知
- (void)notifyMediaStart:(NSString *)userid
{
    VCLog(@"userid:%@", userid);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyMediaStart:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyMediaStart:userid];
        }
    });
}

// 影音停止播放的通知
- (void)notifyMediaStop:(NSString *)userid reason:(MEDIA_STOP_REASON)reason
{
    VCLog(@"userid:%@ reason:%zd", userid, reason);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyMediaStop:reason:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyMediaStop:userid reason:reason];
        }
    });
}

// 影音暂停播放的通知
- (void)notifyMediaPause:(NSString *)userid bPause:(BOOL)bPause
{
    VCLog(@"userid:%@ bPause:%zd", userid, bPause);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyMediaPause:bPause:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyMediaPause:userid bPause:bPause];
        }
    });
}

// 视频帧数据已解好
- (void)notifyMemberMediaData:(NSString *)userid curPos:(int)curPos
{
    VCLog(@"userid:%@", userid);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:notifyMemberMediaData:curPos:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self notifyMemberMediaData:userid curPos:curPos];
        }
    });
}

/**
 云端录制状态改变
 @param state 云端录制状态
 @param sdkErr 错误码
 */
- (void)svrRecordStateChanged:(MIXER_STATE)state err:(CRVIDEOSDK_ERR_DEF)sdkErr
{
    VCLog(@"state:%zd sdkErr:%d", state, sdkErr);
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:svrRecordStateChanged:err:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self svrRecordStateChanged:state err:sdkErr];
        }
    });
}

/**
 云端录制状态改变 新接口
 @param state 云端录制状态
 @param sdkErr 错误码
 @param opratorID 混图id
 */
- (void)svrMixerStateChanged:(MIXER_STATE)state err:(CRVIDEOSDK_ERR_DEF)sdkErr opratorID:(NSString*)opratorID
{
    
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:svrMixerStateChanged:err:opratorID:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self svrMixerStateChanged:(MIXER_STATE)state err:(CRVIDEOSDK_ERR_DEF)sdkErr opratorID:opratorID];
        }
    });
    
}
/**
 云端录制内容改变
 @param videoIDs 云端录制内容集合
 */
- (void)svrRecVideosChanged:(NSArray <RecContentItem *> *)videoIDs
{
    VCLog(@"");
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([_videoMeetingDelegate respondsToSelector:@selector(videoMeetingCallBack:svrRecVideosChanged:)]) {
            [_videoMeetingDelegate videoMeetingCallBack:self svrRecVideosChanged:videoIDs];
        }
    });
}
@end
