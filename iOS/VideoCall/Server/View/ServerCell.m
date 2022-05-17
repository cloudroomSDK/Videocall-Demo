//
//  ServerCell.m
//  VideoCall
//
//  Created by king on 2016/11/23.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "ServerCell.h"

NSString * const server_ID = @"ServerCell";

@interface ServerCell ()

@end

@implementation ServerCell
#pragma mark - selector
- (IBAction)clickBtnForServer:(UIButton *)sender
{
    if (_btnResponse) {
        _btnResponse(self, sender);
    }
}
@end
