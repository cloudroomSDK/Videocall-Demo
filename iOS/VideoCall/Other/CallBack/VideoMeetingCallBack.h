//
//  VideoMeetingCallBack.h
//  VideoCall
//
//  Created by king on 2017/6/7.
//  Copyright © 2017年 CloudRoom. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

@class VideoMeetingCallBack;

@protocol VideoMeetingDelegate <NSObject>

@optional
// 入会成功(入会失败，将自动发起releaseCall）
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback enterMeetingRslt:(CRVIDEOSDK_ERR_DEF)code;
// user进入了会话
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback userEnterMeeting:(NSString *)userID;
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback userLeftMeeting:(NSString *)userID;
// 创建会议
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback createMeetingSuccess:(int)meetID password:(NSString *)password cookie:(NSString *)cookie;
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback createMeetingFail:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie;
// 结束会议的结果
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback endMeetingRslt:(CRVIDEOSDK_ERR_DEF)code;
// 会议被结束了
- (void)videoMeetingCallBackMeetingStopped:(VideoMeetingCallBack *)callback;
// 会议掉线
- (void)videoMeetingCallBackMeetingDropped:(VideoMeetingCallBack *)callback;
// 最新网络评分0~10(10分为最佳网络)
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback netStateChanged:(int)level;
// 麦声音强度更新(level取值0~10)
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback micEnergyUpdate:(NSString *)userID oldLevel:(int)oldLevel newLevel:(int)newLevel;
// 本地音频设备有变化
- (void)videoMeetingCallBackAudioDevChanged:(VideoMeetingCallBack *)callback;
// 音频设备状态变化
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback audioStatusChanged:(NSString *)userID oldStatus:(AUDIO_STATUS)oldStatus newStatus:(AUDIO_STATUS)newStatus;
// 视频设备状态变化
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback videoStatusChanged:(NSString *)userID oldStatus:(VIDEO_STATUS)oldStatus newStatus:(VIDEO_STATUS)newStatus;
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback openVideoRslt:(NSString *)devID success:(BOOL)bSuccess;
// 成员有新的视频图像数据到来(通过GetVideoImg获取）
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyVideoData:(UsrVideoId *)userID frameTime:(long)frameTime;
// 本地视频设备有变化
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback videoDevChanged:(NSString *)userID;
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback defVideoChanged:(NSString *)userID videoID:(short)videoID;
// 屏幕共享操作通知
- (void)videoMeetingCallBackNotifyScreenShareStarted:(VideoMeetingCallBack *)callback;
- (void)videoMeetingCallBackNotifyScreenShareStopped:(VideoMeetingCallBack *)callback;
// 屏幕共享数据更新,用户收到该回调消息后应该调用getShareScreenDecodeImg获取最新的共享数据
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyScreenShareData:(NSString *)userID changedRect:(CGRect)changedRect frameSize:(CGSize)size;
// IM消息发送结果
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback sendIMmsgRlst:(NSString *)taskID sdkErr:(CRVIDEOSDK_ERR_DEF)sdkErr cookie:(NSString *)cookie;
// 通知收到文本消息
// FIXME:SDK更新,IM回调崩溃 modified by king 20170905
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyIMmsg:(NSString *)romUserID text:(NSString *)text sendTime:(int)sendTime;
// 影音开始通知
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyMediaStart:(NSString *)userid;
// 影音停止播放的通知
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyMediaStop:(NSString *)userid reason:(MEDIA_STOP_REASON)reason;
// 影音暂停播放的通知
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyMediaPause:(NSString *)userid bPause:(BOOL)bPause;
// 视频帧数据已解好
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback notifyMemberMediaData:(NSString *)userid curPos:(int)curPos;
// 云端录制状态改变
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback svrRecordStateChanged:(MIXER_STATE)state err:(CRVIDEOSDK_ERR_DEF)sdkErr;

- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback  svrMixerStateChanged:(MIXER_STATE)state err:(CRVIDEOSDK_ERR_DEF)sdkErr opratorID:(NSString*)opratorID;
//  云端录制设备改变
- (void)videoMeetingCallBack:(VideoMeetingCallBack *)callback svrRecVideosChanged:(NSArray <RecContentItem *> *)videoIDs;

@end

@interface VideoMeetingCallBack : NSObject  <CloudroomVideoMeetingCallBack>

@property (nonatomic, weak) id <VideoMeetingDelegate> videoMeetingDelegate;

@end
