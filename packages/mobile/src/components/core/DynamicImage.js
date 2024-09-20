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
import { useEffect, memo, useCallback, useRef, useState } from 'react';
import { useInstanceVar } from '@audius/common/hooks';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Skeleton from 'app/components/skeleton';
var styles = StyleSheet.create({
    imageContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    },
    children: {
        position: 'relative',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
/*
 * Displays a skeleton while loading an image
 * then fades in the image
 */
var ImageLoader = function (_a) {
    var source = _a.source, style = _a.style, stylesProp = _a.styles, immediate = _a.immediate, children = _a.children, onLoad = _a.onLoad, animatedValue = _a.animatedValue, noSkeleton = _a.noSkeleton, imageProps = __rest(_a, ["source", "style", "styles", "immediate", "children", "onLoad", "animatedValue", "noSkeleton"]);
    var _b = useState(0), size = _b[0], setSize = _b[1];
    var skeletonOpacity = useRef(new Animated.Value(1)).current;
    var _c = useState(false), isAnimationFinished = _c[0], setIsAnimationFinished = _c[1];
    var handleSetSize = useCallback(function (event) {
        setSize(event.nativeEvent.layout.width);
    }, []);
    var handleLoad = useCallback(function () {
        Animated.timing(skeletonOpacity, {
            toValue: 0,
            duration: immediate ? 100 : 500,
            useNativeDriver: true
        }).start(function () {
            onLoad === null || onLoad === void 0 ? void 0 : onLoad();
            setIsAnimationFinished(true);
        });
    }, [skeletonOpacity, onLoad, immediate]);
    useEffect(function () {
        // Reset the animation when the source changes
        if (source) {
            setIsAnimationFinished(false);
            skeletonOpacity.setValue(1);
        }
    }, [source, skeletonOpacity]);
    return (<View onLayout={handleSetSize}>
      {source ? (<Image source={source} style={[{ width: size, height: size }, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.image]} {...imageProps} onLoad={handleLoad}/>) : null}
      {!isAnimationFinished && !noSkeleton ? (<Animated.View style={[
                stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.imageContainer,
                styles.imageContainer,
                { opacity: skeletonOpacity }
            ]}>
          <Skeleton width={size} height={size} style={[{ width: size, height: size }, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.image]}/>
        </Animated.View>) : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>);
};
var interpolateImageScale = function (animatedValue) {
    return animatedValue.interpolate({
        inputRange: [-200, 0],
        outputRange: [4, 1],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp'
    });
};
var interpolateImageTranslate = function (animatedValue) {
    return animatedValue.interpolate({
        inputRange: [-200, 0],
        outputRange: [-40, 0],
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });
};
/**
 * A dynamic image that transitions between changes to the `source` prop.
 */
export var DynamicImage = memo(function DynamicImage(_a) {
    var source = _a.source, style = _a.style, stylesProp = _a.styles, immediate = _a.immediate, children = _a.children, onLoad = _a.onLoad, animatedValue = _a.animatedValue, imageProps = __rest(_a, ["source", "style", "styles", "immediate", "children", "onLoad", "animatedValue"]);
    var _b = useState(source), firstImage = _b[0], setFirstImage = _b[1];
    var _c = useState(), secondImage = _c[0], setSecondImage = _c[1];
    var firstOpacity = useRef(new Animated.Value(1)).current;
    var secondOpacity = useRef(new Animated.Value(0)).current;
    var _d = useState(true), isFirstImageActive = _d[0], setIsFirstImageActive = _d[1];
    var _e = useInstanceVar(source), getPrevImage = _e[0], setPrevImage = _e[1];
    var animateTo = useCallback(function (anim, toValue, callback) {
        return Animated.timing(anim, {
            toValue: toValue,
            duration: immediate ? 100 : 500,
            useNativeDriver: true
        }).start(callback);
    }, [immediate]);
    useEffect(function () {
        // Skip animation for subsequent loads where the image hasn't changed
        var previousImage = getPrevImage();
        if (previousImage === source) {
            return;
        }
        setPrevImage(source);
        if (isFirstImageActive) {
            setIsFirstImageActive(false);
            setSecondImage(source);
            animateTo(secondOpacity, 1, function () {
                onLoad === null || onLoad === void 0 ? void 0 : onLoad();
                firstOpacity.setValue(0);
                setFirstImage(undefined);
            });
        }
        else {
            setIsFirstImageActive(true);
            setFirstImage(source);
            firstOpacity.setValue(1);
            animateTo(secondOpacity, 0, function () {
                onLoad === null || onLoad === void 0 ? void 0 : onLoad();
                setSecondImage(undefined);
            });
        }
    }, [
        animateTo,
        firstOpacity,
        getPrevImage,
        source,
        isFirstImageActive,
        secondOpacity,
        setIsFirstImageActive,
        setPrevImage,
        onLoad,
        firstImage,
        secondImage
    ]);
    return (<Animated.View pointerEvents={children ? undefined : 'none'} style={[
            stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root,
            style,
            animatedValue
                ? {
                    transform: [
                        {
                            scale: interpolateImageScale(animatedValue)
                        },
                        {
                            translateY: interpolateImageTranslate(animatedValue)
                        }
                    ]
                }
                : {}
        ]}>
      <Animated.View style={[
            stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.imageContainer,
            styles.imageContainer,
            { opacity: firstOpacity }
        ]}>
        <ImageLoader source={firstImage} styles={stylesProp} {...imageProps}/>
      </Animated.View>
      {secondImage ? (<Animated.View style={[
                stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.imageContainer,
                styles.imageContainer,
                { opacity: secondOpacity }
            ]}>
          <ImageLoader source={secondImage} styles={stylesProp} {...imageProps}/>
        </Animated.View>) : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </Animated.View>);
});
