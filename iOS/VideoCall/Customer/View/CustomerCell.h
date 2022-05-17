//
//  CustomerCell.h
//  VideoCall
//
//  Created by king on 2016/11/23.
//  Copyright © 2016年 CloudRoom. All rights reserved.
//

#import <UIKit/UIKit.h>

UIKIT_EXTERN NSString * const customer_ID;

@interface CustomerCell : UITableViewCell

@property (weak, nonatomic) IBOutlet UILabel *titleLabel;
@property (weak, nonatomic) IBOutlet UILabel *descLabel;

@end
