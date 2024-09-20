import { ANIMATION_SOURCE, GESTURE_SOURCE, KEYBOARD_STATE, SCROLLABLE_TYPE, WINDOW_HEIGHT, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { Keyboard, Platform } from 'react-native';
import { runOnJS, useWorkletCallback } from 'react-native-reanimated';
export var clamp = function (value, lowerBound, upperBound) {
    'worklet';
    return Math.min(Math.max(lowerBound, value), upperBound);
};
export var snapPoint = function (value, velocity, points) {
    'worklet';
    var point = value + 0.2 * velocity;
    var deltas = points.map(function (p) { return Math.abs(point - p); });
    var minDelta = Math.min.apply(null, deltas);
    return points.filter(function (p) { return Math.abs(point - p) === minDelta; })[0];
};
var dismissKeyboard = Keyboard.dismiss;
/**
 *
 * Custom gesture event handlers hook for @gorhom/bottom-sheet.
 * This is needed to enable scrolling at every snapPoint.
 * The changes to the default hook are marked with a comment.
 */
export var useGestureEventsHandlers = function () {
    // #region variables
    var _a = useBottomSheetInternal(), animatedPosition = _a.animatedPosition, animatedSnapPoints = _a.animatedSnapPoints, animatedKeyboardState = _a.animatedKeyboardState, animatedKeyboardHeight = _a.animatedKeyboardHeight, animatedContainerHeight = _a.animatedContainerHeight, animatedScrollableType = _a.animatedScrollableType, animatedHighestSnapPoint = _a.animatedHighestSnapPoint, animatedClosedPosition = _a.animatedClosedPosition, animatedScrollableContentOffsetY = _a.animatedScrollableContentOffsetY, enableOverDrag = _a.enableOverDrag, enablePanDownToClose = _a.enablePanDownToClose, overDragResistanceFactor = _a.overDragResistanceFactor, isInTemporaryPosition = _a.isInTemporaryPosition, isScrollableRefreshable = _a.isScrollableRefreshable, animateToPosition = _a.animateToPosition, stopAnimation = _a.stopAnimation;
    // #endregion
    // #region gesture methods
    var handleOnStart = useWorkletCallback(function handleOnStart(__, _, context) {
        // cancel current animation
        stopAnimation();
        // store current animated position
        context.initialPosition = animatedPosition.value;
        context.initialKeyboardState = animatedKeyboardState.value;
        /**
         * if the scrollable content is scrolled, then
         * we lock the position.
         */
        if (animatedScrollableContentOffsetY.value > 0) {
            context.isScrollablePositionLocked = true;
        }
    }, [
        stopAnimation,
        animatedPosition,
        animatedKeyboardState,
        animatedScrollableContentOffsetY
    ]);
    var handleOnActive = useWorkletCallback(function handleOnActive(source, _a, context) {
        var translationY = _a.translationY;
        var highestSnapPoint = animatedHighestSnapPoint.value;
        /**
         * if keyboard is shown, then we set the highest point to the current
         * position which includes the keyboard height.
         */
        if (isInTemporaryPosition.value &&
            context.initialKeyboardState === KEYBOARD_STATE.SHOWN) {
            highestSnapPoint = context.initialPosition;
        }
        /**
         * if current position is out of provided `snapPoints` and smaller then
         * highest snap pont, then we set the highest point to the current position.
         */
        if (isInTemporaryPosition.value &&
            context.initialPosition < highestSnapPoint) {
            highestSnapPoint = context.initialPosition;
        }
        var lowestSnapPoint = enablePanDownToClose
            ? animatedContainerHeight.value
            : animatedSnapPoints.value[0];
        var atSnapPoint = animatedSnapPoints.value.some(function (v) { return animatedPosition.value === v; });
        /**
         * if scrollable is refreshable and sheet position at the highest
         * point, then do not interact with current gesture.
         */
        if (source === GESTURE_SOURCE.SCROLLABLE &&
            isScrollableRefreshable.value &&
            animatedPosition.value === highestSnapPoint) {
            return;
        }
        /**
         * NOTE: this is the change to the default hook.
         * If the drawer is at a a snap point and the scrollable is scrolled,
         * do not handle the gesture
         */
        if (source === GESTURE_SOURCE.SCROLLABLE &&
            atSnapPoint &&
            animatedScrollableContentOffsetY.value !== 0) {
            return;
        }
        /**
         * a negative scrollable content offset to be subtracted from accumulated
         * current position and gesture translation Y to allow user to drag the sheet,
         * when scrollable position at the top.
         * a negative scrollable content offset when the scrollable is not locked.
         */
        var negativeScrollableContentOffset = (context.initialPosition === highestSnapPoint &&
            source === GESTURE_SOURCE.SCROLLABLE) ||
            !context.isScrollablePositionLocked
            ? animatedScrollableContentOffsetY.value * -1
            : 0;
        /**
         * an accumulated value of starting position with gesture translation y.
         */
        var draggedPosition = context.initialPosition + translationY;
        /**
         * an accumulated value of dragged position and negative scrollable content offset,
         * this will insure locking sheet position when user is scrolling the scrollable until,
         * they reach to the top of the scrollable.
         */
        var accumulatedDraggedPosition = draggedPosition + negativeScrollableContentOffset;
        /**
         * a clamped value of the accumulated dragged position, to insure keeping the dragged
         * position between the highest and lowest snap points.
         */
        var clampedPosition = clamp(accumulatedDraggedPosition, highestSnapPoint, lowestSnapPoint);
        /**
         * if scrollable position is locked and the animated position
         * reaches the highest point, then we unlock the scrollable position.
         */
        if (context.isScrollablePositionLocked &&
            source === GESTURE_SOURCE.SCROLLABLE &&
            animatedPosition.value === highestSnapPoint) {
            context.isScrollablePositionLocked = false;
        }
        /**
         * over-drag implementation.
         */
        if (enableOverDrag) {
            if ((source === GESTURE_SOURCE.HANDLE ||
                animatedScrollableType.value === SCROLLABLE_TYPE.VIEW) &&
                draggedPosition < highestSnapPoint) {
                var resistedPosition = highestSnapPoint -
                    Math.sqrt(1 + (highestSnapPoint - draggedPosition)) *
                        overDragResistanceFactor;
                animatedPosition.value = resistedPosition;
                return;
            }
            if (source === GESTURE_SOURCE.HANDLE &&
                draggedPosition > lowestSnapPoint) {
                var resistedPosition = lowestSnapPoint +
                    Math.sqrt(1 + (draggedPosition - lowestSnapPoint)) *
                        overDragResistanceFactor;
                animatedPosition.value = resistedPosition;
                return;
            }
            if (source === GESTURE_SOURCE.SCROLLABLE &&
                draggedPosition + negativeScrollableContentOffset > lowestSnapPoint) {
                var resistedPosition = lowestSnapPoint +
                    Math.sqrt(1 +
                        (draggedPosition +
                            negativeScrollableContentOffset -
                            lowestSnapPoint)) *
                        overDragResistanceFactor;
                animatedPosition.value = resistedPosition;
                return;
            }
        }
        animatedPosition.value = clampedPosition;
    }, [
        enableOverDrag,
        enablePanDownToClose,
        overDragResistanceFactor,
        isInTemporaryPosition,
        isScrollableRefreshable,
        animatedHighestSnapPoint,
        animatedContainerHeight,
        animatedSnapPoints,
        animatedPosition,
        animatedScrollableType,
        animatedScrollableContentOffsetY
    ]);
    var handleOnEnd = useWorkletCallback(function handleOnEnd(source, _a, context) {
        var translationY = _a.translationY, absoluteY = _a.absoluteY, velocityY = _a.velocityY;
        var highestSnapPoint = animatedHighestSnapPoint.value;
        var isSheetAtHighestSnapPoint = animatedPosition.value === highestSnapPoint;
        var atSnapPoint = animatedSnapPoints.value.some(function (v) { return animatedPosition.value === v; });
        /**
         * if scrollable is refreshable and sheet position at the highest
         * point, then do not interact with current gesture.
         */
        if (source === GESTURE_SOURCE.SCROLLABLE &&
            isScrollableRefreshable.value &&
            isSheetAtHighestSnapPoint) {
            return;
        }
        /**
         * NOTE: this is the change to the default hook.
         * If the drawer is at a a snap point and the scrollable is scrolled,
         * do not handle the gesture if the scroll is downwards
         */
        if (source === GESTURE_SOURCE.SCROLLABLE &&
            atSnapPoint &&
            animatedScrollableContentOffsetY.value > 0) {
            return;
        }
        /**
         * if the sheet is in a temporary position and the gesture ended above
         * the current position, then we snap back to the temporary position.
         */
        if (isInTemporaryPosition.value &&
            context.initialPosition >= animatedPosition.value) {
            if (context.initialPosition > animatedPosition.value) {
                animateToPosition(context.initialPosition, ANIMATION_SOURCE.GESTURE, velocityY / 2);
            }
            return;
        }
        /**
         * close keyboard if current position is below the recorded
         * start position and keyboard still shown.
         */
        var isScrollable = animatedScrollableType.value !== SCROLLABLE_TYPE.UNDETERMINED &&
            animatedScrollableType.value !== SCROLLABLE_TYPE.VIEW;
        /**
         * if keyboard is shown and the sheet is dragged down,
         * then we dismiss the keyboard.
         */
        if (context.initialKeyboardState === KEYBOARD_STATE.SHOWN &&
            animatedPosition.value > context.initialPosition) {
            /**
             * if the platform is ios, current content is scrollable and
             * the end touch point is below the keyboard position then
             * we exit the method.
             *
             * because the the keyboard dismiss is interactive in iOS.
             */
            if (!(Platform.OS === 'ios' &&
                isScrollable &&
                absoluteY > WINDOW_HEIGHT - animatedKeyboardHeight.value)) {
                runOnJS(dismissKeyboard)();
            }
        }
        /**
         * reset isInTemporaryPosition value
         */
        if (isInTemporaryPosition.value) {
            isInTemporaryPosition.value = false;
        }
        /**
         * clone snap points array, and insert the container height
         * if pan down to close is enabled.
         */
        var snapPoints = animatedSnapPoints.value.slice();
        if (enablePanDownToClose) {
            snapPoints.unshift(animatedClosedPosition.value);
        }
        /**
         * calculate the destination point, using redash.
         */
        var destinationPoint = snapPoint(translationY + context.initialPosition, velocityY, snapPoints);
        /**
         * if destination point is the same as the current position,
         * then no need to perform animation.
         */
        if (destinationPoint === animatedPosition.value) {
            return;
        }
        var wasGestureHandledByScrollView = source === GESTURE_SOURCE.SCROLLABLE &&
            animatedScrollableContentOffsetY.value > 0;
        /**
         * prevents snapping from top to middle / bottom with repeated interrupted scrolls
         */
        if (wasGestureHandledByScrollView && isSheetAtHighestSnapPoint) {
            return;
        }
        animateToPosition(destinationPoint, ANIMATION_SOURCE.GESTURE, velocityY / 2);
    }, [
        enablePanDownToClose,
        isInTemporaryPosition,
        isScrollableRefreshable,
        animatedClosedPosition,
        animatedHighestSnapPoint,
        animatedKeyboardHeight,
        animatedPosition,
        animatedScrollableType,
        animatedSnapPoints,
        animatedScrollableContentOffsetY,
        animateToPosition
    ]);
    // #endregion
    return {
        handleOnStart: handleOnStart,
        handleOnActive: handleOnActive,
        handleOnEnd: handleOnEnd
    };
};
