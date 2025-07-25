import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleCast
import RNBootSplash
import RNNotifications
import TiktokOpensdkReactNative

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    RNNotifications.startMonitorNotifications()
    
    // Configure Google Cast
    let receiverAppID = "222B31C8"
    let criteria = GCKDiscoveryCriteria(applicationID: receiverAppID)
    let options = GCKCastOptions(discoveryCriteria: criteria)
    // Allow our app to control chromecast volume
    options.physicalVolumeButtonsWillControlDeviceVolume = true
    // Prevent backgrounding from suspending sessions
    options.suspendSessionsWhenBackgrounded = false
    GCKCastContext.setSharedInstance(with: options)
    
    self.moduleName = "AudiusReactNative"
    self.dependencyProvider = RCTAppDependencyProvider()
    
    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }
  
  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
  
  // Handle URL opening
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    let handledByTikTokOpenSDK = TiktokOpensdkReactNative.handleOpenURL(url)
    let handledByRNLinkingManager = RCTLinkingManager.application(app, open: url, options: options)
    return handledByTikTokOpenSDK || handledByRNLinkingManager
  }
  
  // Handle Universal Links
  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    let handledByTikTokOpenSDK = TiktokOpensdkReactNative.handleUserActivity(userActivity)
    let handledByRNLinkingManager = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return handledByTikTokOpenSDK || handledByRNLinkingManager
  }
  
  // Handle remote notification registration
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNNotifications.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }
  
  override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNNotifications.didFailToRegisterForRemoteNotifications(withError: error)
  }
  
  override func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNNotifications.didReceiveBackgroundNotification(userInfo, withCompletionHandler: completionHandler)
  }
  
  override func customizeRootView(_ rootView: RCTRootView) {
    super.customizeRootView(rootView)
    RNBootSplash.init(withStoryboard: "BootSplash", rootView: rootView) // ⬅️ initialize the splash screen
  }
} 