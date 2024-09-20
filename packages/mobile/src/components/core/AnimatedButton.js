var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import LottieView from 'lottie-react-native';
import { Pressable } from 'react-native';
import { usePrevious } from 'react-use';
import { light, medium } from 'app/haptics';
export var AnimatedButton = function (_a) {
    var externalIconIndex = _a.iconIndex, iconJSON = _a.iconJSON, isActive = _a.isActive, _b = _a.isDisabled, isDisabled = _b === void 0 ? false : _b, onLongPress = _a.onLongPress, onPress = _a.onPress, renderUnderlay = _a.renderUnderlay, resizeMode = _a.resizeMode, style = _a.style, wrapperStyle = _a.wrapperStyle, haptics = _a.haptics, hapticsConfig = _a.hapticsConfig, waitForAnimationFinish = _a.waitForAnimationFinish, children = _a.children, lottieProps = _a.lottieProps, pressableProps = __rest(_a, ["iconIndex", "iconJSON", "isActive", "isDisabled", "onLongPress", "onPress", "renderUnderlay", "resizeMode", "style", "wrapperStyle", "haptics", "hapticsConfig", "waitForAnimationFinish", "children", "lottieProps"]);
    var _c = useState(externalIconIndex !== null && externalIconIndex !== void 0 ? externalIconIndex : 0), iconIndex = _c[0], setIconIndex = _c[1];
    var _d = useState(false), isPlaying = _d[0], setIsPlaying = _d[1];
    var animationRef = useRef();
    var previousExternalIconIndex = usePrevious(externalIconIndex);
    var previousActiveState = usePrevious(isActive);
    // When externalIconIndex is updated, update iconIndex
    // if animation isn't currently playing
    if (externalIconIndex !== undefined &&
        previousExternalIconIndex !== undefined &&
        previousExternalIconIndex !== externalIconIndex &&
        iconIndex !== externalIconIndex &&
        !isPlaying) {
        setIconIndex(externalIconIndex);
    }
    var hasMultipleStates = Array.isArray(iconJSON);
    var source;
    if (hasMultipleStates) {
        source = iconJSON[iconIndex];
    }
    else {
        source = iconJSON;
    }
    var handleHaptics = useCallback(function () {
        var haptic = haptics !== null && haptics !== void 0 ? haptics : hapticsConfig === null || hapticsConfig === void 0 ? void 0 : hapticsConfig[iconIndex];
        if (haptic === 'light')
            light();
        else if (haptic === 'medium')
            medium();
        else if (haptic)
            medium();
    }, [haptics, hapticsConfig, iconIndex]);
    var handleAnimationFinish = useCallback(function () {
        if (waitForAnimationFinish) {
            onPress === null || onPress === void 0 ? void 0 : onPress();
        }
        if (hasMultipleStates) {
            setIconIndex(function (iconIndex) {
                // If externalIconIndex is provided,
                // set iconIndex to it
                if (externalIconIndex !== undefined) {
                    return externalIconIndex;
                }
                // Otherwise increment iconIndex
                return (iconIndex + 1) % iconJSON.length;
            });
        }
        setIsPlaying(false);
    }, [
        waitForAnimationFinish,
        onPress,
        hasMultipleStates,
        setIconIndex,
        setIsPlaying,
        iconJSON,
        externalIconIndex
    ]);
    var handlePress = useCallback(function () {
        var _a;
        handleHaptics();
        if (hasMultipleStates || !isActive) {
            setIsPlaying(true);
            (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.play();
        }
        if (!waitForAnimationFinish) {
            onPress === null || onPress === void 0 ? void 0 : onPress();
        }
    }, [
        handleHaptics,
        isActive,
        setIsPlaying,
        hasMultipleStates,
        animationRef,
        waitForAnimationFinish,
        onPress
    ]);
    var handleLongPress = useCallback(function () {
        if (onLongPress) {
            handleHaptics();
            onLongPress();
        }
        else {
            handlePress();
        }
    }, [onLongPress, handleHaptics, handlePress]);
    // For multi state buttons, when `isActive` flips, trigger
    // the animation to run
    useEffect(function () {
        var _a;
        if (hasMultipleStates) {
            if (isActive !== previousActiveState && !isPlaying) {
                setIsPlaying(true);
                (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.play();
            }
        }
    }, [
        isActive,
        previousActiveState,
        isPlaying,
        setIsPlaying,
        hasMultipleStates,
        animationRef
    ]);
    var progress = useMemo(function () {
        if (hasMultipleStates || isPlaying) {
            return undefined;
        }
        return isActive ? 1 : 0;
    }, [isPlaying, isActive, hasMultipleStates]);
    // For binary state buttons, reset the animation
    // when not playing. This prevents the animation from getting stuck
    // in the active state when many rerenders are happening
    useEffect(function () {
        var _a;
        if (!hasMultipleStates && !isActive && !isPlaying) {
            (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.reset();
        }
    }, [hasMultipleStates, isActive, isPlaying]);
    return iconJSON ? (<Pressable hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }} {...pressableProps} disabled={isDisabled} onPress={handlePress} onLongPress={handleLongPress} style={style}>
      {function (pressableState) { return (<>
          {renderUnderlay === null || renderUnderlay === void 0 ? void 0 : renderUnderlay(pressableState)}
          {/* The key is needed for animations to work on android  */}
          <LottieView style={[
                !hasMultipleStates ? { opacity: isActive ? 1 : 0 } : undefined,
                wrapperStyle
            ]} key={hasMultipleStates ? iconIndex : undefined} ref={function (animation) { return (animationRef.current = animation); }} onAnimationFinish={handleAnimationFinish} progress={progress} loop={false} source={source} resizeMode={resizeMode} {...lottieProps}/>
          {/**
             * Secondary animation that is visible when inactive. This ensures
             * active->inactive transition is smooth, since Lottie onAnimationFinish
             * does not do this smoothly and results in partially inactive states.
             */}
          {!hasMultipleStates ? (<LottieView key={isActive ? 'active' : 'inactive'} style={[{ opacity: isActive ? 0 : 1 }, wrapperStyle]} progress={0} loop={false} source={source} resizeMode={resizeMode}/>) : null}
          {children}
        </>); }}
    </Pressable>) : null;
};
