package co.audius.app;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.nsure.nsure.NSure;

import javax.annotation.Nonnull;

public class NSureSDK extends ReactContextBaseJavaModule {
    public NSureSDK(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "NSureSDK";
    }

    @ReactMethod
    public void getDeviceId(String appId, String partnerId, Callback callback){
        NSure nSure = NSure.getInstance(this.getReactApplicationContext(), appId, partnerId);
        callback.invoke(nSure.getDeviceId());
    }
}
