package co.audius.app;

import android.os.Bundle;
import androidx.annotation.Nullable;
import com.facebook.react.ReactActivity;
import com.google.android.gms.cast.framework.CastContext;


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

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);

    // lazy load Google Cast context
    CastContext.getSharedInstance(this);
  }
}
