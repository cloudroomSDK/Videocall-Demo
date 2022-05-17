//
//  ServerCell.h
//  VideoCall
//
//  Created by king on 2016/11/23.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import <UIKit/UIKit.h>

UIKIT_EXTERN NSString * const server_ID;

@class ServerCell;

typedef void (^ServerBtnResponse) (ServerCell *weakCell, UIButton *sender);

@interface ServerCell : UITableViewCell

@property (weak, nonatomic) IBOutlet UILabel *nameText; /**< 窗口名 */
@property (weak, nonatomic) IBOutlet UILabel *countText; /**< 排队人数 */
@property (weak, nonatomic) IBOutlet UILabel *serviceText; /**< 工作人员 */
@property (weak, nonatomic) IBOutlet UILabel *servicingText; /**< 正在进行 */
@property (weak, nonatomic) IBOutlet UIButton *serverBtn; /**< 服务状态 */
@property (nonatomic, copy) ServerBtnResponse btnResponse;

- (IBAction)clickBtnForServer:(UIButton *)sender;

@end
