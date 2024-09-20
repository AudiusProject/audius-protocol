import { useCallback, useEffect, useRef, useState } from 'react';
import LottieView from 'lottie-react-native';
import { Animated } from 'react-native';
import { usePrevious } from 'react-use';
import IconRefreshPull from 'app/assets/animations/iconRefreshPull.json';
import IconRefreshSpin from 'app/assets/animations/iconRefreshSpin.json';
import * as haptics from 'app/haptics';
import { makeAnimations, makeStyles } from 'app/styles';
import { attachToScroll } from 'app/utils/animation';
import { colorize } from 'app/utils/colorizeLottie';
var PULL_DISTANCE = 75;
var DEBOUNCE_TIME_MS = 0;
var useAnimations = makeAnimations(function (_a) {
    var palette = _a.palette;
    var neutralLight4 = palette.neutralLight4, staticWhite = palette.staticWhite;
    var iconRefreshSpin = colorize(IconRefreshSpin, {
        'assets.0.layers.0.shapes.0.it.1.ck': neutralLight4
    });
    var iconRefreshPull = colorize(IconRefreshPull, {
        // arrow Outlines 4.Group 1.Stroke 1
        'assets.0.layers.0.shapes.0.it.1.c.k': neutralLight4,
        // arrow Outlines 2.Group 3.Stroke 1
        'layers.1.shapes.0.it.1.c.k': neutralLight4,
        // arrow Outlines.Group 1.Stroke 1
        'layers.2.shapes.0.it.1.c.k': neutralLight4,
        // arrow Outlines.Group 2.Stroke 1
        'layers.2.shapes.1.it.1.c.k': neutralLight4
    });
    var iconRefreshSpinWhite = colorize(IconRefreshSpin, {
        'assets.0.layers.0.shapes.0.it.1.ck': staticWhite
    });
    var iconRefreshPullWhite = colorize(IconRefreshPull, {
        // arrow Outlines 4.Group 1.Stroke 1
        'assets.0.layers.0.shapes.0.it.1.c.k': staticWhite,
        // arrow Outlines 2.Group 3.Stroke 1
        'layers.1.shapes.0.it.1.c.k': staticWhite,
        // arrow Outlines.Group 1.Stroke 1
        'layers.2.shapes.0.it.1.c.k': staticWhite,
        // arrow Outlines.Group 2.Stroke 1
        'layers.2.shapes.1.it.1.c.k': staticWhite
    });
    return {
        neutral: {
            spin: iconRefreshSpin,
            pull: iconRefreshPull
        },
        white: { spin: iconRefreshSpinWhite, pull: iconRefreshPullWhite }
    };
});
var useStyles = makeStyles(function () { return ({
    root: {
        width: '100%',
        position: 'absolute',
        height: 20,
        zIndex: 10
    }
}); });
var interpolateTranslateY = function (scrollAnim) {
    return scrollAnim.interpolate({
        inputRange: [-24, 0],
        outputRange: [10, 0],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp'
    });
};
var interpolateHitTopOpacity = function (scrollAnim, scrollDistance) {
    return scrollAnim.interpolate({
        inputRange: [-60, scrollDistance, scrollDistance + 12],
        outputRange: [1, 1, 0],
        extrapolateRight: 'clamp'
    });
};
var interpolateOpacity = function (scrollAnim) {
    return scrollAnim.interpolate({
        inputRange: [-60, -16],
        outputRange: [1, 0],
        extrapolateRight: 'clamp'
    });
};
/**
 * A helper hook to get desired pull to refresh behavior.
 * 1. Momentum scrolling does not trigger pull to refresh
 */
export var useOverflowHandlers = function (_a) {
    var isRefreshing = _a.isRefreshing, scrollResponder = _a.scrollResponder, onRefresh = _a.onRefresh, onScroll = _a.onScroll;
    var scrollAnim = useRef(new Animated.Value(0)).current;
    var _b = useState(false), isMomentumScroll = _b[0], setIsMomentumScroll = _b[1];
    var currentYOffset = useRef(0);
    var wasRefreshing = usePrevious(isRefreshing);
    var scrollTo = useCallback(function (y, animated) {
        if (animated === void 0) { animated = true; }
        if (scrollResponder && 'scrollTo' in scrollResponder) {
            scrollResponder === null || scrollResponder === void 0 ? void 0 : scrollResponder.scrollTo({ y: y, animated: animated });
        }
        if (scrollResponder && 'scrollToOffset' in scrollResponder) {
            scrollResponder === null || scrollResponder === void 0 ? void 0 : scrollResponder.scrollToOffset({ offset: y });
        }
    }, [scrollResponder]);
    useEffect(function () {
        if (!isRefreshing && wasRefreshing && isMomentumScroll) {
            // If we don't wait, then this triggers too quickly causing scrollToTop
            // when user is already engaging with content
            var timeout_1 = setTimeout(function () {
                if (currentYOffset.current < 0)
                    scrollTo(0);
            }, DEBOUNCE_TIME_MS);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [isRefreshing, wasRefreshing, scrollTo, isMomentumScroll]);
    var handleScroll = useCallback(function (e) {
        currentYOffset.current = e.nativeEvent.contentOffset.y;
        onScroll === null || onScroll === void 0 ? void 0 : onScroll(e);
    }, [onScroll]);
    var onScrollBeginDrag = useCallback(function (e) {
        currentYOffset.current = e.nativeEvent.contentOffset.y;
        setIsMomentumScroll(false);
    }, [setIsMomentumScroll]);
    var onScrollEndDrag = useCallback(function (e) {
        currentYOffset.current = e.nativeEvent.contentOffset.y;
        setIsMomentumScroll(true);
        if (isRefreshing && currentYOffset.current <= 0) {
            scrollTo(-50);
        }
    }, [setIsMomentumScroll, scrollTo, isRefreshing]);
    var attachedHandleScroll = attachToScroll(scrollAnim, {
        listener: handleScroll
    });
    return {
        isRefreshing: onRefresh ? Boolean(isRefreshing) : undefined,
        isRefreshDisabled: isMomentumScroll,
        handleRefresh: onRefresh,
        scrollAnim: scrollAnim,
        handleScroll: attachedHandleScroll,
        onScrollBeginDrag: onScrollBeginDrag,
        onScrollEndDrag: onScrollEndDrag
    };
};
/**
 * Custom pull to refresh to be used with React Native ScrollViews
 * (FlatList, SectionList, etc.).
 *
 * Usage:
 * ```
 * const scrollAnim = useRef(new Animated.Value(0)).current
 *
 * const MyList = () => {
 *  return (
 *    <View>
 *      <PullToRefresh
 *        isRefreshing={}
 *        onRefresh={}
 *      />
 *      <ScrollView
 *        onScroll={attachToScroll(scrollAnim)}
 *        {...props}
 *      />
 *  )
 * }
 * ```
 *
 * Two usage modes of PullToRefresh are provided.
 * If the PullToRefresh is intended to appear in the overscroll
 * space above the view, see `useOverscrollHandlers`
 * Otherwise, the component may suffice.
 */
export var PullToRefresh = function (_a) {
    var isRefreshing = _a.isRefreshing, onRefresh = _a.onRefresh, isRefreshDisabled = _a.isRefreshDisabled, scrollAnim = _a.scrollAnim, _b = _a.topOffset, topOffset = _b === void 0 ? 0 : _b, _c = _a.yOffsetDisappearance, yOffsetDisappearance = _c === void 0 ? 0 : _c, color = _a.color;
    var styles = useStyles();
    var wasRefreshing = usePrevious(isRefreshing);
    var _d = useState(false), didHitTop = _d[0], setDidHitTop = _d[1];
    var hitTop = useRef(false);
    var _e = useState(false), shouldShowSpinner = _e[0], setShouldShowSpinner = _e[1];
    var animationRef = useRef();
    var _f = useAnimations(), neutral = _f.neutral, white = _f.white;
    var _g = color ? white : neutral, spin = _g.spin, pull = _g.pull;
    var colorizedIcon = shouldShowSpinner ? spin : pull;
    var handleAnimationFinish = useCallback(function (isCancelled) {
        if (!isCancelled) {
            setShouldShowSpinner(true);
            setImmediate(function () {
                var _a;
                (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.play();
            });
        }
    }, [setShouldShowSpinner]);
    useEffect(function () {
        var _a;
        if (isRefreshDisabled !== undefined
            ? !isRefreshing && isRefreshDisabled
            : !isRefreshing && wasRefreshing) {
            setDidHitTop(false);
            setShouldShowSpinner(false);
            (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.reset();
        }
    }, [isRefreshing, hitTop, wasRefreshing, isRefreshDisabled]);
    var listenerRef = useRef();
    var handleScroll = useCallback(function (_a) {
        var _b;
        var value = _a.value;
        if (value === 0) {
            hitTop.current = false;
            setDidHitTop(false);
        }
        if (value < -1 * PULL_DISTANCE && !hitTop.current && !isRefreshDisabled) {
            hitTop.current = true;
            setDidHitTop(true);
            haptics.light();
            onRefresh === null || onRefresh === void 0 ? void 0 : onRefresh();
            (_b = animationRef.current) === null || _b === void 0 ? void 0 : _b.play();
        }
    }, [onRefresh, isRefreshDisabled]);
    useEffect(function () {
        listenerRef.current = scrollAnim === null || scrollAnim === void 0 ? void 0 : scrollAnim.addListener(handleScroll);
        return function () {
            if (listenerRef.current) {
                scrollAnim === null || scrollAnim === void 0 ? void 0 : scrollAnim.removeListener(listenerRef.current);
            }
        };
    }, [scrollAnim, handleScroll]);
    return scrollAnim ? (<Animated.View style={[
            styles.root,
            {
                top: topOffset,
                transform: [
                    {
                        translateY: interpolateTranslateY(scrollAnim)
                    }
                ],
                opacity: didHitTop
                    ? interpolateHitTopOpacity(scrollAnim, yOffsetDisappearance)
                    : interpolateOpacity(scrollAnim)
            }
        ]}>
      <LottieView style={{ height: '100%', width: '100%' }} ref={function (animation) { return (animationRef.current = animation); }} loop={shouldShowSpinner} autoPlay={false} source={colorizedIcon} onAnimationFinish={handleAnimationFinish}/>
    </Animated.View>) : null;
};
