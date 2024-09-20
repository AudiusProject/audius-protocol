import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
export var usePressScaleAnimation = function (scaleTo, useNativeDriver) {
    if (scaleTo === void 0) { scaleTo = 0.97; }
    if (useNativeDriver === void 0) { useNativeDriver = true; }
    var scaleAnim = useRef(new Animated.Value(1));
    var startPress = useCallback(function () {
        if (scaleTo === null)
            return;
        Animated.spring(scaleAnim.current, {
            toValue: scaleTo,
            stiffness: 500,
            damping: 1,
            overshootClamping: true,
            useNativeDriver: useNativeDriver
        }).start();
    }, [scaleTo, useNativeDriver]);
    var releasePress = useCallback(function () {
        if (scaleTo === null)
            return;
        Animated.spring(scaleAnim.current, {
            toValue: 1,
            stiffness: 200,
            damping: 10,
            overshootClamping: true,
            useNativeDriver: useNativeDriver
        }).start();
    }, [scaleTo, useNativeDriver]);
    return {
        scale: scaleAnim.current,
        handlePressIn: startPress,
        handlePressOut: releasePress
    };
};
