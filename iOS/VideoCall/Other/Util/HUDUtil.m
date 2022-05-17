//
//  HUDUtil.m
//  MLive
//
//  Created by king on 2017/8/8.
//  Copyright © 2017年 CloudRoom. All rights reserved.
//

#import "HUDUtil.h"
#import "MBProgressHUD.h"

@implementation HUDUtil

/**
 展示进度过程
 @param text 内容
 @param animated 是否动画
 */
+ (void)hudShowProgress:(NSString *)text animated:(BOOL)animated
{
    MBProgressHUD *hud = [MBProgressHUD showHUDAddedTo:[[[UIApplication sharedApplication] delegate] window] animated:animated];
    [hud setLabelText:text];
}


/**
 隐藏进度过程
 @param animated 是否动画
 */
+ (void)hudHiddenProgress:(BOOL)animated
{
    [MBProgressHUD hideHUDForView:[[[UIApplication sharedApplication] delegate] window] animated:animated];
}

/**
 展示结果
 @param text 内容
 @param delay 延迟几秒隐藏
 @param animated 是否动画
 */
+ (void)hudShow:(NSString *)text delay:(NSTimeInterval)delay animated:(BOOL)animated
{
    MBProgressHUD *hud = [MBProgressHUD showHUDAddedTo:[[[UIApplication sharedApplication] delegate] window] animated:animated];
    hud.mode = MBProgressHUDModeText;
    hud.labelText = text;
    hud.margin = 10.f;
    hud.removeFromSuperViewOnHide = YES;
    [hud hide:YES afterDelay:delay];
}

@end
