package co.audius.app;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "AudiusReactNative";
  }

  @Override
  public void invokeDefaultOnBackPressed() {
      // Not calling super. invokeDefaultOnBackPressed() b/c it will close the app.
      // Instead, put the app in the backgroud to allow audio to keep playing.
      moveTaskToBack(true);
  }
}
