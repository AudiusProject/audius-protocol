//
//  AirplayViewManager.m
//  Manages toggling of airplay
//  AudiusReactNative
//

#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import <AVKit/AVRoutePickerView.h>

@interface AirplayViewManager : RCTViewManager
@end

@implementation AirplayViewManager

AVRoutePickerView *routePickerView;
UIButton* underlyingButton;

RCT_EXPORT_MODULE(AirplayViewManager)

- (UIView *)view
{
  routePickerView = [[AVRoutePickerView alloc] initWithFrame:CGRectMake(0.0f, 30.0f, 30.0f, 30.0f)];
  routePickerView.backgroundColor = [UIColor lightGrayColor];
  
  NSArray *subviews = [routePickerView subviews];
  for (UIView *subview in subviews) {
    if ([subview isKindOfClass:[UIButton class]]) {
      underlyingButton = subview;
    }
  }
  
  return routePickerView;
}

RCT_EXPORT_METHOD(click)
{
  // Make sure to dispatch the click on the main queue so it's fast the first time
  dispatch_async(dispatch_get_main_queue(), ^{
    [underlyingButton sendActionsForControlEvents: UIControlEventTouchUpInside];
  });
}

@end
