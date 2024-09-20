import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
var options = {
    enableVibrateFallback: false,
    ignoreAndroidSystemSettings: false
};
export var light = function () {
    if (Platform.OS === 'android') {
        // @ts-ignore
        ReactNativeHapticFeedback.trigger('keyboardPress', options);
    }
    else {
        ReactNativeHapticFeedback.trigger('impactLight', options);
    }
};
export var medium = function () {
    if (Platform.OS === 'android') {
        // This should be updated to match ios impactMedium
        // @ts-ignore
        ReactNativeHapticFeedback.trigger('keyboardPress', options);
    }
    else {
        ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
};
