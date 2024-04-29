//
//  CallHelper.m
//  VideoCall
//
//  Created by king on 2017/6/8.
//  Copyright © 2017年 CloudRoom. All rights reserved.
//

#import "CallHelper.h"
#import "AppConfig.h"

NSString * const CallHelper_server = @"server";
NSString * const CallHelper_account = @"account";
NSString * const CallHelper_pswd = @"pswd";
NSString * const CallHelper_nickname = @"nickname";
NSString * const roler = @"roler";

@interface CallHelper ()

@property (nonatomic, copy, readwrite) NSString *server; /**< 服务器地址 */
@property (nonatomic, copy, readwrite) NSString *account; /**< 账户 */
@property (nonatomic, copy, readwrite) NSString *pswd; /**< 密码 */
@property (nonatomic, copy, readwrite) NSString *nickname; /**< 登录昵称 */

@end

@implementation CallHelper
#pragma mark - singleton
static CallHelper *shareInstance;
+ (instancetype)shareInstance
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [[self alloc] init];
    });
    return shareInstance;
}

+ (instancetype)allocWithZone:(struct _NSZone *)zone
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shareInstance = [super allocWithZone:zone];
    });
    return shareInstance;
}

- (instancetype)init
{
    self = [super init];
    
    if (!self) {
        return nil;
    }
    
    [self readInfo];
    
    if ([NSString stringCheckEmptyOrNil:_account] ||
        [NSString stringCheckEmptyOrNil:_pswd]
        ) {
        _account = KDefaultAppID;
        _pswd = KDefaultAppSecret;
    }
    
    if ([NSString stringCheckEmptyOrNil:_server]) {
        [self resetInfo];
    }
    
    _settingInfo = [NSMutableDictionary dictionaryWithObjectsAndKeys:@(RolerTypeCustom), roler, nil];
    
    return self;
}

#pragma mark - public method
- (void)writeAccount:(NSString *)account pswd:(NSString *)pswd server:(NSString *)server
{
    if (account.length > 0) _account = account;
    if (pswd.length > 0) _pswd = pswd;
    _server = server;
    
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:account forKey:CallHelper_account];
    [userDefaults setObject:pswd forKey:CallHelper_pswd];
    [userDefaults setObject:server forKey:CallHelper_server];
    [userDefaults synchronize];
}

- (void)writeNickname:(NSString *)nickname
{
    _nickname = nickname;
    
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:_nickname forKey:CallHelper_nickname];
    [userDefaults synchronize];
}

- (void)readInfo
{
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    _server = [userDefaults stringForKey:CallHelper_server];
    _account = [userDefaults stringForKey:CallHelper_account];
    _pswd = [userDefaults stringForKey:CallHelper_pswd];
    _nickname = [userDefaults stringForKey:CallHelper_nickname];
}

- (void)resetInfo;
{
    [self writeAccount:nil pswd:nil server:@"sdk.cloudroom.com"];
    [self readInfo];
    _account = KDefaultAppID;
    _pswd = KDefaultAppSecret;
}
@end
