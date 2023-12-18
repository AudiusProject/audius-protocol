package co.audius.app;

import android.os.Bundle
import androidx.annotation.Nullable
import com.bytedance.sdk.open.tiktok.TikTokOpenApiFactory
import com.bytedance.sdk.open.tiktok.TikTokOpenConfig
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.android.gms.cast.framework.CastContext
import com.zoontek.rnbars.RNBars
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is
   * used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AudiusReactNative"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)


  overide fun invokeDefaultOnBackPressed(): void {
    // Not calling super. invokeDefaultOnBackPressed() b/c it will close the app.
    // Instead, put the app in the backgroud to allow audio to keep playing.
    moveTaskToBack(true);
  }

  overide fun onCreate(Bundle savedInstanceState): void {
    RNBootSplash.init(this);
    super.onCreate(null);
    RNBars.init(this, "light-content");
    TikTokOpenApiFactory.init(new TikTokOpenConfig(BuildConfig.TIKTOK_APP_ID));

    // lazy load Google Cast context
    CastContext.getSharedInstance(this);
  }
}
