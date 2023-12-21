//
//  NSureSDK.m
//
//  Copyright © 2019 nSure. All rights reserved.
//

#import "NSureSDK.h"
#import <nSure/nSure.h>

@implementation NSureSDK

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE();

/*!
 Returns (and creates, if needed) a singleton instance of the API.
 
 This method will return a singleton instance of the <code>nSure</code> class for
 you using the given app ID. If an instance does not exist, this method will create
 one using <code>initWithToken:launchOptions:andFlushInterval:</code>.
 
 @param appId        your app ID
 */
RCT_EXPORT_METHOD(sharedInstanceWithAppID:(NSString *)appId partnerId:(NSString *)partnerId callback:(RCTResponseSenderBlock)callback)
{
  NSure *nsure = [NSure sharedInstanceWithAppID:appId partherID:partnerId];
  callback(@[nsure, nsure.deviceId]);
}

/*!
 *  Returns a previously instantiated singleton instance.
 */
RCT_EXPORT_METHOD(sharedInstanceWithCallback:(RCTResponseSenderBlock)callback)
{
  NSure *nsure = [NSure sharedInstance];
  callback(@[nsure]);
}

/**
 *  Returns the nSure device ID.
 */
RCT_EXPORT_METHOD(deviceIdWithCallback:(RCTResponseSenderBlock)callback)
{
  NSure *nsure = [NSure sharedInstance];
  callback(@[nsure.deviceId]);
}

/*!
 *  Returns the nSure SDK version.
 */
RCT_EXPORT_METHOD(versionWithCallback:(RCTResponseSenderBlock)callback)
{
  NSure *nsure = [NSure sharedInstance];
  callback(@[nsure.version]);
}

@end
