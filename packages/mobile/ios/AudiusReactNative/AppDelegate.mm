#import "AppDelegate.h"
#import "RNBootSplash.h"

#import <Firebase.h>
#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTAppSetupUtils.h>
#import <React/RCTLinkingManager.h>
#import "RNNotifications.h"

#import <CodePush/CodePush.h>
#import <TikTokOpenSDK/TikTokOpenSDKApplicationDelegate.h>

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperPerformancePlugin.h>
#endif

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
#ifdef FB_SONARKIT_ENABLED
  FlipperClient *client = [FlipperClient sharedClient];
  [client addPlugin:[FlipperPerformancePlugin new]];
#endif

  [FIRApp configure];
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

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
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
