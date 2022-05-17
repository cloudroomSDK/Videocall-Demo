//
//  ServiceModel.h
//  VideoCall
//
//  Created by king on 2016/12/2.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CloudroomVideoSDK_IOS/CloudroomVideoSDK_IOS.h>

@interface ServiceModel : NSObject

@property (nonatomic, strong) QueueInfo *queueInfo;
@property (nonatomic, strong) QueueStatus *queueStatus;
@property (nonatomic, getter = isServiced) BOOL serviced;

@end
