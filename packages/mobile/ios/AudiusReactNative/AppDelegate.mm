#import "AppDelegate.h"
#import "RNBootSplash.h"

#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import "RNNotifications.h"

#import <CodePush/CodePush.h>
#import <TikTokOpenSDK/TikTokOpenSDKApplicationDelegate.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[TikTokOpenSDKApplicationDelegate sharedInstance] application:application openURL:url sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey] annotation:options[UIApplicationOpenURLOptionsAnnotationKey]] || [RCTLinkingManager application:application openURL:url options:options];
}

// Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [RNNotifications startMonitorNotifications];
  NSString *receiverAppID = @"222B31C8";
  GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:receiverAppID];
  GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
  // Allow our app to control chromecast volume
  options.physicalVolumeButtonsWillControlDeviceVolume = YES;
  // Prevent backgrounding from suspending sessions
  options.suspendSessionsWhenBackgrounded = NO;
  [GCKCastContext setSharedInstanceWithOptions:options];

  self.moduleName = @"AudiusReactNative";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [super application:application didFinishLaunchingWithOptions:launchOptions];

  [RNBootSplash initWithStoryboard:@"BootSplash" rootView:self.window.rootViewController.view]; // <- initialization using the storyboard file name

  [[TikTokOpenSDKApplicationDelegate sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [CodePush bundleURL];
#endif
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [RNNotifications didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  [RNNotifications didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler {
  [RNNotifications didReceiveBackgroundNotification:userInfo withCompletionHandler:completionHandler];
}
@end
