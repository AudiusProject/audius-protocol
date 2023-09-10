package co.foo;

import android.content.Context;
import com.google.android.gms.cast.framework.CastOptions;
import com.reactnative.googlecast.GoogleCastOptionsProvider;

public class CastOptionsProvider extends GoogleCastOptionsProvider {
  @Override
  public CastOptions getCastOptions(Context context) {
    CastOptions castOptions = new CastOptions.Builder()
        .setReceiverApplicationId("222B31C8")
        .build();
    return castOptions;
  }
}