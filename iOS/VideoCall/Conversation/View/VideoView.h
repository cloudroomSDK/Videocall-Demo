//
//  VideoView.h
//  Meeting
//
//  Created by king on 2017/11/15.
//  Copyright © 2017年 BossKing10086. All rights reserved.
//

#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

@class UsrVideoId;

@interface VideoView : CLCameraView

@property (nonatomic, strong) UsrVideoId *usrVideoId; /**< 信息 */
@property (nonatomic, assign) CGFloat ratioW; /**< 宽 */
@property (nonatomic, assign) CGFloat ratioH; /**< 高 */

@end
