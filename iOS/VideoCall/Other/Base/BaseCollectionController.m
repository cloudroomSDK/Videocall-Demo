//
//  BaseCollectionController.m
//  VideoCall
//
//  Created by king on 2016/11/23.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "BaseCollectionController.h"

static NSString * const reuseIdentifier = @"Cell";

@interface BaseCollectionController ()

@end

@implementation BaseCollectionController
#pragma mark - life cycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    
    // register cell classes
    [self.collectionView registerClass:[UICollectionViewCell class] forCellWithReuseIdentifier:reuseIdentifier];
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    
    // 显示导航栏
    if ([self.navigationController isNavigationBarHidden]) {
        [self.navigationController setNavigationBarHidden:NO];
    }
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
