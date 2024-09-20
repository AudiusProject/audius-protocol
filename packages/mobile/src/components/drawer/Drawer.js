var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from 'app/styles';
import { attachToDy } from 'app/utils/animation';
import { DrawerHeader } from './DrawerHeader';
import { FULL_DRAWER_HEIGHT } from './constants';
var MAX_SHADOW_OPACITY = 0.15;
var ON_MOVE_RESPONDER_DY = 10;
var MOVE_CUTOFF_CLOSE = 0.8;
var BORDER_RADIUS = 40;
var BACKGROUND_OPACITY = 0.5;
// Controls the amount of friction in swiping when overflowing up or down
var OVERFLOW_FRICTION = 4;
export var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        drawer: {
            backgroundColor: palette.white,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            shadowRadius: 15,
            borderTopRightRadius: BORDER_RADIUS,
            borderTopLeftRadius: BORDER_RADIUS,
            overflow: 'hidden'
        },
        fullDrawer: {
            top: 0,
            height: '100%'
        },
        content: {
            height: 'auto'
        },
        fullScreenContent: {
            height: '100%'
        },
        dismissContainer: {
            position: 'absolute',
            top: 24,
            left: 24
        },
        backgroundRoot: {
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '100%'
        },
        background: {
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '100%',
            backgroundColor: 'black'
        },
        skirt: {
            backgroundColor: palette.neutralLight10,
            width: '100%',
            height: 800
        }
    });
});
export var DrawerAnimationStyle;
(function (DrawerAnimationStyle) {
    DrawerAnimationStyle["STIFF"] = "STIFF";
    DrawerAnimationStyle["SPRINGY"] = "SPRINGY";
})(DrawerAnimationStyle || (DrawerAnimationStyle = {}));
export var springToValue = function (_a) {
    var animation = _a.animation, value = _a.value, animationStyle = _a.animationStyle, drawerHeight = _a.drawerHeight, finished = _a.finished, velocity = _a.velocity, overshootClamping = _a.overshootClamping;
    var tension;
    var friction;
    switch (animationStyle) {
        case DrawerAnimationStyle.STIFF:
            tension = 150;
            friction = 25;
            break;
        case DrawerAnimationStyle.SPRINGY:
            // Factor the height of the drawer into the spring physics.
            // Without this, short drawers tend to feel sluggish while
            // tall drawers really get going.
            tension = 70 + 60 * (1 - Math.min(drawerHeight / FULL_DRAWER_HEIGHT, 1));
            friction = 10 + 2 * (1 - Math.min(drawerHeight / FULL_DRAWER_HEIGHT, 1));
            break;
    }
    Animated.spring(animation, {
        toValue: value,
        tension: tension,
        friction: friction,
        useNativeDriver: true,
        velocity: velocity,
        overshootClamping: overshootClamping
    }).start(finished);
};
export var Drawer = function (_a) {
    var _b = _a.blockClose, blockClose = _b === void 0 ? false : _b, isOpen = _a.isOpen, children = _a.children, onClose = _a.onClose, onClosed = _a.onClosed, onOpen = _a.onOpen, title = _a.title, titleIcon = _a.titleIcon, titleImage = _a.titleImage, isFullscreen = _a.isFullscreen, _c = _a.shouldBackgroundDim, shouldBackgroundDim = _c === void 0 ? true : _c, _d = _a.isGestureSupported, isGestureSupported = _d === void 0 ? true : _d, _e = _a.animationStyle, animationStyle = _e === void 0 ? DrawerAnimationStyle.SPRINGY : _e, _f = _a.initialOffsetPosition, initialOffsetPosition = _f === void 0 ? 0 : _f, shouldCloseToInitialOffset = _a.shouldCloseToInitialOffset, _g = _a.shouldHaveRoundedBordersAtInitialOffset, shouldHaveRoundedBordersAtInitialOffset = _g === void 0 ? false : _g, _h = _a.zIndex, zIndex = _h === void 0 ? 5 : _h, CustomDrawerHeader = _a.drawerHeader, drawerStyle = _a.drawerStyle, _j = _a.shouldShowShadow, shouldShowShadow = _j === void 0 ? true : _j, shouldAnimateShadow = _a.shouldAnimateShadow, onPercentOpen = _a.onPercentOpen, onPanResponderMove = _a.onPanResponderMove, onPanResponderRelease = _a.onPanResponderRelease, providedTranslationAnim = _a.translationAnim, disableSafeAreaView = _a.disableSafeAreaView;
    var styles = useStyles();
    var insets = useSafeAreaInsets();
    var _k = useState(isFullscreen ? FULL_DRAWER_HEIGHT : 0), drawerHeight = _k[0], setDrawerHeight = _k[1];
    // Initial position of the drawer when closed
    var initialPosition = FULL_DRAWER_HEIGHT;
    // Position of the drawer when it is in an offset but closed state
    var initialOffsetOpenPosition = FULL_DRAWER_HEIGHT - initialOffsetPosition - insets.bottom;
    // Position of the fully opened drawer
    var openPosition = FULL_DRAWER_HEIGHT - drawerHeight;
    var newTranslationAnim = useRef(new Animated.Value(initialPosition));
    var translationAnim = providedTranslationAnim || newTranslationAnim.current;
    var shadowAnim = useRef(new Animated.Value(0));
    var borderRadiusAnim = useRef(new Animated.Value(BORDER_RADIUS));
    var backgroundOpacityAnim = useRef(new Animated.Value(0));
    // Capture the intent of opening the drawer (for use in pan responder release).
    // Generally when releasing a pan responder, we don't want to update state until
    // the resulting animation has completed. The completion of that animation may be
    // well after the user has started yet another pan gesture though, and we definitely
    // want to capture the users previous intent so that our next pan gesture can be
    // handled properly.
    var isOpenIntent = useRef(isOpen);
    var slideIn = useCallback(function (position, velocity, onFinished) {
        springToValue({
            animation: translationAnim,
            value: position,
            animationStyle: animationStyle,
            drawerHeight: drawerHeight,
            velocity: velocity,
            finished: function (_a) {
                var finished = _a.finished;
                if (finished) {
                    onFinished === null || onFinished === void 0 ? void 0 : onFinished();
                }
            }
        });
        if (isFullscreen) {
            springToValue({
                animation: borderRadiusAnim.current,
                value: 0,
                drawerHeight: drawerHeight,
                animationStyle: animationStyle,
                velocity: velocity
            });
        }
        if (shouldBackgroundDim) {
            springToValue({
                animation: shadowAnim.current,
                value: MAX_SHADOW_OPACITY,
                drawerHeight: drawerHeight,
                animationStyle: animationStyle,
                overshootClamping: true
            });
            springToValue({
                animation: backgroundOpacityAnim.current,
                value: BACKGROUND_OPACITY,
                drawerHeight: drawerHeight,
                animationStyle: animationStyle,
                overshootClamping: true
            });
        }
    }, [
        translationAnim,
        shouldBackgroundDim,
        isFullscreen,
        animationStyle,
        drawerHeight
    ]);
    var slideOut = useCallback(function (position, velocity, onFinished) {
        springToValue({
            animation: translationAnim,
            value: position,
            drawerHeight: drawerHeight,
            animationStyle: animationStyle,
            overshootClamping: true,
            finished: function (_a) {
                var finished = _a.finished;
                if (finished) {
                    onFinished === null || onFinished === void 0 ? void 0 : onFinished();
                    onClosed === null || onClosed === void 0 ? void 0 : onClosed();
                }
            },
            velocity: velocity
        });
        if (isFullscreen) {
            springToValue({
                animation: borderRadiusAnim.current,
                value: BORDER_RADIUS,
                drawerHeight: drawerHeight,
                animationStyle: animationStyle,
                overshootClamping: true
            });
        }
        if (shouldBackgroundDim) {
            springToValue({
                animation: shadowAnim.current,
                value: 0,
                drawerHeight: drawerHeight,
                animationStyle: animationStyle,
                overshootClamping: true
            });
            springToValue({
                animation: backgroundOpacityAnim.current,
                value: 0,
                drawerHeight: drawerHeight,
                animationStyle: animationStyle,
                overshootClamping: true
            });
        }
    }, [
        translationAnim,
        isFullscreen,
        shouldBackgroundDim,
        animationStyle,
        onClosed,
        drawerHeight
    ]);
    useEffect(function () {
        if (isOpen) {
            isOpenIntent.current = true;
            slideIn(openPosition);
        }
        else {
            isOpenIntent.current = false;
            if (!isOpen && shouldCloseToInitialOffset) {
                borderRadiusAnim.current.setValue(0);
                slideOut(initialOffsetOpenPosition);
            }
            else {
                slideOut(initialPosition);
            }
        }
    }, [
        slideIn,
        slideOut,
        isOpen,
        openPosition,
        initialPosition,
        shouldCloseToInitialOffset,
        initialOffsetOpenPosition
    ]);
    var panResponder = useMemo(function () {
        return PanResponder.create({
            onMoveShouldSetPanResponder: function (e, gestureState) {
                return Math.abs(gestureState.dy) > ON_MOVE_RESPONDER_DY;
            },
            /**
             * Callback when the user is dragging on the drawer.
             * There are two primary modes of operation:
             *  - Normal drawers that open by some UI action and can be swiped away by a user
             *  - Drawers that are partially showing on the screen (e.g. Now Playing)
             *    that start at an initial offset and can be dragged open
             */
            onPanResponderMove: function (e, gestureState) {
                if (isOpen ||
                    isOpenIntent.current ||
                    (!isOpen && shouldCloseToInitialOffset)) {
                    if (gestureState.dy > 0) {
                        // Dragging downwards
                        // Bound percentOpen to [0, 1]
                        var percentOpen = (drawerHeight -
                            (!isOpenIntent.current ? drawerHeight : gestureState.dy)) /
                            drawerHeight;
                        if (isOpenIntent.current) {
                            var newTranslation = openPosition + gestureState.dy;
                            attachToDy(translationAnim, newTranslation)(e);
                            if (shouldBackgroundDim) {
                                var newOpacity = BACKGROUND_OPACITY * percentOpen;
                                attachToDy(backgroundOpacityAnim.current, newOpacity)(e);
                            }
                            if (isFullscreen) {
                                var newBorderRadius = BORDER_RADIUS * (1 - percentOpen);
                                attachToDy(borderRadiusAnim.current, newBorderRadius)(e);
                            }
                            // If we are "closing" the drawer to an offset position
                            if (initialOffsetPosition) {
                                var borderRadiusInitialOffset = shouldHaveRoundedBordersAtInitialOffset
                                    ? // Border radius has rounded corners at the initial offset
                                        BORDER_RADIUS
                                    : // Border radius gains radius (quicklky) as the initial offset is
                                        // left and the drawer drags open
                                        BORDER_RADIUS * percentOpen * 5;
                                // Cap the border radius at the maximum (BORDER_RADIUS)
                                var newBorderRadius = Math.min(borderRadiusInitialOffset, BORDER_RADIUS);
                                // On non-iOS platforms, bring the border radius back to 0 at the fully open state
                                if (Platform.OS !== 'ios') {
                                    newBorderRadius = Math.min(newBorderRadius, BORDER_RADIUS * 2 * (1 - percentOpen));
                                }
                                attachToDy(borderRadiusAnim.current, newBorderRadius)(e);
                            }
                        }
                        // Dragging downwards with an initial offset
                        if (!isOpenIntent.current && shouldCloseToInitialOffset) {
                            var newTranslation = initialOffsetOpenPosition +
                                gestureState.dy / OVERFLOW_FRICTION;
                            attachToDy(translationAnim, newTranslation)(e);
                        }
                        if (onPercentOpen)
                            onPercentOpen(percentOpen);
                    }
                    else if (gestureState.dy < 0) {
                        // Dragging upwards
                        // Bound percentOpen to [0, 1]
                        var percentOpen = (-1 *
                            (isOpenIntent.current
                                ? -1 * drawerHeight
                                : gestureState.dy)) /
                            drawerHeight;
                        if (isOpenIntent.current) {
                            var newTranslation = openPosition + gestureState.dy / OVERFLOW_FRICTION;
                            attachToDy(translationAnim, newTranslation)(e);
                        }
                        // Dragging upwards with an initial offset
                        if (!isOpenIntent.current && shouldCloseToInitialOffset) {
                            var newTranslation = initialOffsetOpenPosition + gestureState.dy;
                            attachToDy(translationAnim, newTranslation)(e);
                            // Set up border animations so that
                            // - In the offset position, they are either 0 or BORDER_RADIUS
                            // - While dragging open, they have BORDER_RADIUS
                            // - While fully open, they are 0
                            var borderRadiusInitialOffset = shouldHaveRoundedBordersAtInitialOffset
                                ? BORDER_RADIUS
                                : BORDER_RADIUS * percentOpen * 5;
                            var newBorderRadius = Math.min(borderRadiusInitialOffset, BORDER_RADIUS);
                            // On non-iOS platforms, bring the border radius back to 0 at the fully open state
                            if (Platform.OS !== 'ios') {
                                newBorderRadius = Math.min(newBorderRadius, BORDER_RADIUS * 2 * (1 - percentOpen));
                            }
                            attachToDy(borderRadiusAnim.current, newBorderRadius)(e);
                        }
                        if (onPercentOpen)
                            onPercentOpen(percentOpen);
                    }
                }
                if (onPanResponderMove)
                    onPanResponderMove(e, gestureState);
            },
            /**
             * When the user releases their hold of the drawer
             */
            onPanResponderRelease: function (e, gestureState) {
                if (isOpen ||
                    isOpenIntent.current ||
                    (!isOpen && shouldCloseToInitialOffset)) {
                    // Close if open & drag is past cutoff
                    if (gestureState.vy > 0 &&
                        gestureState.moveY >
                            FULL_DRAWER_HEIGHT - MOVE_CUTOFF_CLOSE * drawerHeight) {
                        if (shouldCloseToInitialOffset) {
                            slideOut(initialOffsetOpenPosition, gestureState.vy, onClose);
                            isOpenIntent.current = false;
                            borderRadiusAnim.current.setValue(0);
                        }
                        else {
                            slideOut(initialPosition, gestureState.vy, onClose);
                            isOpenIntent.current = false;
                        }
                    }
                    else {
                        slideIn(openPosition, gestureState.vy, onOpen);
                        isOpenIntent.current = true;
                        // If an initial offset is defined, clear the border radius
                        if (shouldHaveRoundedBordersAtInitialOffset &&
                            initialOffsetOpenPosition) {
                            borderRadiusAnim.current.setValue(0);
                        }
                    }
                }
                if (onPanResponderRelease)
                    onPanResponderRelease(e, gestureState);
            }
        });
    }, [
        translationAnim,
        drawerHeight,
        initialOffsetOpenPosition,
        isFullscreen,
        initialOffsetPosition,
        initialPosition,
        isOpen,
        onClose,
        onOpen,
        onPanResponderMove,
        onPanResponderRelease,
        onPercentOpen,
        openPosition,
        shouldBackgroundDim,
        shouldCloseToInitialOffset,
        shouldHaveRoundedBordersAtInitialOffset,
        slideIn,
        slideOut
    ]);
    var handlePressClose = useCallback(function () {
        if (!blockClose) {
            onClose();
        }
    }, [blockClose, onClose]);
    // NOTE: sk - Need to interpolate the border radius bc of a funky
    // issue with border radius under 1 in ios
    var interpolatedBorderRadius = borderRadiusAnim.current.interpolate({
        inputRange: [0, 0.99, 1, BORDER_RADIUS],
        outputRange: [0, 0, 1, BORDER_RADIUS]
    });
    var renderBackground = function () {
        return (<View pointerEvents={isOpen ? undefined : 'none'} style={[styles.backgroundRoot, { zIndex: zIndex }]}>
        <TouchableWithoutFeedback onPress={isGestureSupported ? onClose : undefined}>
          <Animated.View style={[
                styles.background,
                { opacity: backgroundOpacityAnim.current }
            ]}/>
        </TouchableWithoutFeedback>
      </View>);
    };
    var renderContent = function () {
        var ViewComponent = disableSafeAreaView ? View : SafeAreaView;
        var edgeProps = disableSafeAreaView
            ? undefined
            : {
                edges: __spreadArray(['bottom'], (isFullscreen ? ['top'] : []), true)
            };
        return (<ViewComponent style={isFullscreen ? styles.fullScreenContent : styles.content} onLayout={function (event) {
                if (!isFullscreen) {
                    var height = event.nativeEvent.layout.height;
                    setDrawerHeight(height);
                }
            }} {...edgeProps}>
        {CustomDrawerHeader ? (<CustomDrawerHeader onClose={handlePressClose}/>) : (<DrawerHeader onClose={handlePressClose} title={title} titleIcon={titleIcon} titleImage={titleImage} isFullscreen={isFullscreen}/>)}
        {children}
      </ViewComponent>);
    };
    return (<>
      {shouldBackgroundDim ? renderBackground() : null}
      <Animated.View {...(isGestureSupported ? panResponder.panHandlers : {})} style={[
            styles.drawer,
            drawerStyle,
            isFullscreen && styles.fullDrawer,
            {
                elevation: zIndex,
                zIndex: zIndex,
                shadowOpacity: shouldShowShadow
                    ? shouldAnimateShadow
                        ? shadowAnim.current
                        : MAX_SHADOW_OPACITY
                    : 0,
                transform: [
                    {
                        translateY: translationAnim
                    }
                ],
                borderTopRightRadius: interpolatedBorderRadius,
                borderTopLeftRadius: interpolatedBorderRadius
            }
        ]}>
        {renderContent()}
        <View style={styles.skirt}/>
      </Animated.View>
    </>);
};
export default Drawer;
