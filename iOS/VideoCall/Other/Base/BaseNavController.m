//
//  BaseNavController.m
//  VideoCall
//
//  Created by king on 2016/11/22.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import "BaseNavController.h"

@interface BaseNavController ()

@end

@implementation BaseNavController
#pragma mark - life cycle
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self _setupUIForBaseNav];
}

#pragma mark - private method
- (void)_setupUIForBaseNav
{
    UINavigationBar *navBar = [UINavigationBar appearance];
    [navBar setTintColor:[UIColor colorWithRed:48/255.0 green:153/255.0 blue:251/255.0 alpha:1.0]];
}

#pragma mark - override
- (BOOL)shouldAutorotate
{
    return [self.viewControllers.lastObject shouldAutorotate];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
    return [self.viewControllers.lastObject supportedInterfaceOrientations];
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    return [self.viewControllers.lastObject preferredInterfaceOrientationForPresentation];
}
@end
