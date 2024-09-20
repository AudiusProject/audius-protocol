var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { Animated } from 'react-native';
export var attachToDx = function (animation, newValue) {
    return function (e) {
        Animated.event([
            null,
            {
                dx: animation
            }
        ], { useNativeDriver: false })(e, { dx: newValue });
    };
};
export var attachToDy = function (animation, newValue) {
    return function (e) {
        Animated.event([
            null,
            {
                dy: animation
            }
        ], { useNativeDriver: false })(e, { dy: newValue });
    };
};
/**
 * Attaches an animated value to an onScroll.
 * ```
 * const animation = useRef(new Animated.Value(0)).current
 * <List
 *  onScroll={attachToScroll(animation)}
 * />
 * ```
 * Note that we cannot set a custom onScroll and use this animated event
 * or we do not get the ability to useNativeDriver.
 * If you wish to add custom scroll functionality and attach an animation,
 * native driver cannot be used.
 */
export var attachToScroll = function (animation, config) {
    return Animated.event([{ nativeEvent: { contentOffset: { y: animation } } }], __assign({ useNativeDriver: true }, config));
};
