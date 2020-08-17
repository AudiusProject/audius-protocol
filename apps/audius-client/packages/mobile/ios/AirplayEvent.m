//
//  AirplayEventEmitter.m
//  AudiusReactNative
//  Manages events for airplay
//  Note: This code is heavily lifted from
//  https://github.com/gazedash/react-native-airplay-ios/blob/master/ios/RNAirplay.m
//

#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>
#import <AVFoundation/AVFoundation.h>

@interface AirplayEvent : RCTEventEmitter <RCTBridgeModule>

@end

@implementation AirplayEvent

RCT_EXPORT_MODULE(AirplayEvent)

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(start)
{
  // Add observer which will call "deviceChanged" method when audio output changes
  // e.g. headphones connect / disconnect
  [[NSNotificationCenter defaultCenter]
   addObserver:self
   selector: @selector(deviceChanged:)
   name:AVAudioSessionRouteChangeNotification
   object:[AVAudioSession sharedInstance]];
  
  // Also call sendEventAboutConnectedDevice method immediately to send currently connected device
  // at the time of startScan
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [self sendEventAboutConnectedDevice];
  });
}

RCT_EXPORT_METHOD(stop)
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}


- (void)deviceChanged:(NSNotification *)sender {
  // Get current audio output
  [self sendEventAboutConnectedDevice];
}

// Gets current devices and sends an event to React Native with information about it
- (void) sendEventAboutConnectedDevice;
{
  AVAudioSessionRouteDescription *currentRoute = [[AVAudioSession sharedInstance] currentRoute];
  NSString *deviceName;
  NSString *portType;
  NSMutableArray *devices = [NSMutableArray array];
  for (AVAudioSessionPortDescription * output in currentRoute.outputs) {
    deviceName = output.portName;
    portType = output.portType;
    NSDictionary *device = @{ @"deviceName" : deviceName, @"portType" : portType};
    [devices addObject: device];
  }
  [self sendEventWithName:@"deviceConnected" body:@{@"devices": devices}];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"deviceConnected"];
}

@end
