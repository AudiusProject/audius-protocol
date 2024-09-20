import { useBottomSheetInternal, ANIMATION_STATE, SHEET_STATE, SCROLLABLE_STATE } from '@gorhom/bottom-sheet';
import { scrollTo, useWorkletCallback } from 'react-native-reanimated';
export var useScrollEventsHandlers = function (scrollableRef, scrollableContentOffsetY) {
    // hooks
    var _a = useBottomSheetInternal(), animatedSheetState = _a.animatedSheetState, animatedScrollableState = _a.animatedScrollableState, animatedAnimationState = _a.animatedAnimationState, animatedSnapPoints = _a.animatedSnapPoints, animatedPosition = _a.animatedPosition, rootScrollableContentOffsetY = _a.animatedScrollableContentOffsetY;
    // #region callbacks
    var handleOnScroll = useWorkletCallback(function (_a, context) {
        var y = _a.contentOffset.y;
        rootScrollableContentOffsetY.value = y;
        /**
         * if sheet position is extended or fill parent, then we reset
         * `shouldLockInitialPosition` value to false.
         */
        if (animatedSheetState.value === SHEET_STATE.EXTENDED ||
            animatedSheetState.value === SHEET_STATE.FILL_PARENT) {
            context.shouldLockInitialPosition = false;
        }
        var atSnapPoint = animatedSnapPoints.value.some(function (v) { return animatedPosition.value === v; });
        /**
         * NOTE: this is the change to the default hook.
         * If the drawer is not at a a snap point or the scrollable is scrolled upwards,
         * lock the scrolling
         */
        animatedScrollableState.value =
            !atSnapPoint || y < 0
                ? SCROLLABLE_STATE.LOCKED
                : SCROLLABLE_STATE.UNLOCKED;
        if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
            var lockPosition = 0;
            // @ts-ignore
            scrollTo(scrollableRef, 0, lockPosition, false);
            scrollableContentOffsetY.value = lockPosition;
        }
    }, [
        scrollableRef,
        scrollableContentOffsetY,
        animatedScrollableState,
        animatedSheetState,
        animatedPosition,
        animatedSnapPoints
    ]);
    var handleOnBeginDrag = useWorkletCallback(function (_a, context) {
        var y = _a.contentOffset.y;
        scrollableContentOffsetY.value = y;
        rootScrollableContentOffsetY.value = y;
        context.initialContentOffsetY = y;
        /**
         * if sheet position not extended or fill parent and the scrollable position
         * not at the top, then we should lock the initial scrollable position.
         */
        if (animatedSheetState.value !== SHEET_STATE.EXTENDED &&
            animatedSheetState.value !== SHEET_STATE.FILL_PARENT &&
            y > 0) {
            context.shouldLockInitialPosition = true;
        }
        else {
            context.shouldLockInitialPosition = false;
        }
    }, [
        scrollableContentOffsetY,
        animatedSheetState,
        rootScrollableContentOffsetY
    ]);
    var handleOnEndDrag = useWorkletCallback(function (_a, context) {
        var _b;
        var y = _a.contentOffset.y;
        var atSnapPoint = animatedSnapPoints.value.some(function (v) { return animatedPosition.value === v; });
        /**
         * NOTE: this is the change to the default hook.
         * If the drawer is not at a a snap point or the scrollable is scrolled upwards,
         * lock the scrolling
         */
        if (!atSnapPoint || y < 0) {
            var lockPosition = context.shouldLockInitialPosition
                ? (_b = context.initialContentOffsetY) !== null && _b !== void 0 ? _b : 0
                : 0;
            // @ts-ignore
            scrollTo(scrollableRef, 0, lockPosition, false);
            scrollableContentOffsetY.value = lockPosition;
            return;
        }
        if (animatedAnimationState.value !== ANIMATION_STATE.RUNNING) {
            scrollableContentOffsetY.value = y;
            rootScrollableContentOffsetY.value = y;
        }
    }, [
        scrollableRef,
        scrollableContentOffsetY,
        animatedAnimationState,
        animatedScrollableState,
        rootScrollableContentOffsetY
    ]);
    var handleOnMomentumEnd = useWorkletCallback(function (_a, context) {
        var _b;
        var y = _a.contentOffset.y;
        var atSnapPoint = animatedSnapPoints.value.some(function (v) { return animatedPosition.value === v; });
        /**
         * NOTE: this is the change to the default hook.
         * If the drawer is not at a a snap point or the scrollable is scrolled upwards,
         * lock the scrolling
         */
        if (y < 0 || !atSnapPoint) {
            var lockPosition = context.shouldLockInitialPosition
                ? (_b = context.initialContentOffsetY) !== null && _b !== void 0 ? _b : 0
                : 0;
            // @ts-ignore
            scrollTo(scrollableRef, 0, lockPosition, false);
            scrollableContentOffsetY.value = 0;
            return;
        }
        if (animatedAnimationState.value !== ANIMATION_STATE.RUNNING) {
            scrollableContentOffsetY.value = y;
            rootScrollableContentOffsetY.value = y;
        }
    }, [
        scrollableContentOffsetY,
        scrollableRef,
        animatedAnimationState,
        animatedScrollableState,
        rootScrollableContentOffsetY
    ]);
    // #endregion
    return {
        handleOnScroll: handleOnScroll,
        handleOnBeginDrag: handleOnBeginDrag,
        handleOnEndDrag: handleOnEndDrag,
        handleOnMomentumEnd: handleOnMomentumEnd
    };
};
