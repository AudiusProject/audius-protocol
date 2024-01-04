//
//  NSureSDK.h
//
//  Copyright © 2019 nSure. All rights reserved.
//

#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

@interface NSureSDK : NSObject <RCTBridgeModule>

@end
