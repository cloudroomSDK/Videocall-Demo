//
//  BaseController.m
//  VideoCall
//
//  Created by king on 2016/11/22.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "BaseController.h"

@interface BaseController ()

@end

@implementation BaseController
#pragma mark - life cycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self _setupForBase];
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    
    // 显示导航栏
    if ([self.navigationController isNavigationBarHidden]) {
        [self.navigationController setNavigationBarHidden:NO];
    }
}

#pragma mark - private method
- (void)_setupForBase
{
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleDefault];
}

#pragma mark - override
// 是否支持旋转
- (BOOL)shouldAutorotate
{
    return YES;
}

// 支持的旋转类型
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
    return UIInterfaceOrientationMaskPortrait;
}

// 默认进去的类型
- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    return UIInterfaceOrientationPortrait;
}
@end
