import React, { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Animated, Easing } from 'react-native';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette, typography = _a.typography;
    return ({
        rootContainer: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }
    });
});
/**
 * Handrolled implementation of KeyboardAvoidingView. Allows
 * customization of the ratio of the keyboard height by which to translate
 * the content upwards (default 0.75), and the duration of the in/out animations.
 *
 * Mainly built to solve a bug with react-native default KeyboardAvoidingView
 * where the content inside the View would not translate upwards far enough.
 */
export var KeyboardAvoidingView = function (_a) {
    var style = _a.style, _b = _a.keyboardShowingDuration, keyboardShowingDuration = _b === void 0 ? 350 : _b, _c = _a.keyboardHidingDuration, keyboardHidingDuration = _c === void 0 ? 250 : _c, _d = _a.keyboardShowingOffset, keyboardShowingOffset = _d === void 0 ? 0 : _d, onKeyboardShow = _a.onKeyboardShow, onKeyboardHide = _a.onKeyboardHide, children = _a.children;
    var styles = useStyles();
    var keyboardHeight = useRef(new Animated.Value(0));
    var handleKeyboardWillShow = useCallback(function (event) {
        Animated.timing(keyboardHeight.current, {
            toValue: -event.endCoordinates.height + keyboardShowingOffset,
            duration: keyboardShowingDuration,
            // Ease out to start animation fast and settle slowly
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }).start(onKeyboardShow);
    }, [keyboardShowingDuration, keyboardShowingOffset, onKeyboardShow]);
    var handleKeyboardWillHide = useCallback(function (event) {
        Animated.timing(keyboardHeight.current, {
            toValue: 0,
            duration: keyboardHidingDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }).start(onKeyboardHide);
    }, [keyboardHidingDuration, onKeyboardHide]);
    useEffect(function () {
        var showSubscription = Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
        var hideSubscription = Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide);
        return function () {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [handleKeyboardWillHide, handleKeyboardWillShow]);
    return (<Animated.View style={[
            styles.rootContainer,
            style,
            {
                transform: [{ translateY: keyboardHeight.current }]
            }
        ]}>
      {children}
    </Animated.View>);
};
