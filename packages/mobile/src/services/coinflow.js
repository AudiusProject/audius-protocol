import { NativeModules, Platform } from 'react-native';
import { env } from 'app/env';
var nsureSDK = NativeModules.NSureSDK;
var deviceId;
export var getCoinflowDeviceId = function () {
    if (deviceId !== undefined) {
        return deviceId;
    }
    /* Bail early if native module isn't found */
    if (!nsureSDK) {
        console.warn('Native module NSureSDK not found');
        deviceId = '';
        return deviceId;
    }
    if (Platform.OS === 'ios') {
        nsureSDK.sharedInstanceWithAppID(env.COINFLOW_APP_ID, env.COINFLOW_PARTNER_ID, function (_, _deviceId) {
            deviceId = _deviceId !== null && _deviceId !== void 0 ? _deviceId : '';
        });
    }
    else if (Platform.OS === 'android') {
        nsureSDK.getDeviceId(env.COINFLOW_APP_ID, env.COINFLOW_PARTNER_ID, function (_deviceId) {
            deviceId = _deviceId !== null && _deviceId !== void 0 ? _deviceId : '';
        });
    }
    else {
        deviceId = '';
    }
    return deviceId;
};
