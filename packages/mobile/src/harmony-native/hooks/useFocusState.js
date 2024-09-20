import { useState, useCallback } from 'react';
/**
 * Used to track focus state of an element
 *
 * To use:
 * - Pass in other handlers wanted for focus and blur as appropriate
 * - Assign handleFocus to the onFocus of the element
 * - Assign handleBlur to the onBlur of the element
 *
 * @param onFocus The existing onFocus handler, if any, to wrap
 * @param onBlur The existing onBlur handler, if any, to wrap
 * @returns [isFocused, handleFocus, handleBlur]
 */
export var useFocusState = function (onFocus, onBlur) {
    var _a = useState(false), isFocused = _a[0], setIsFocused = _a[1];
    var handleFocus = useCallback(function (e) {
        setIsFocused(true);
        onFocus === null || onFocus === void 0 ? void 0 : onFocus(e);
    }, [onFocus, setIsFocused]);
    var handleBlur = useCallback(function (e) {
        setIsFocused(false);
        onBlur === null || onBlur === void 0 ? void 0 : onBlur(e);
    }, [onBlur, setIsFocused]);
    return [isFocused, handleFocus, handleBlur];
};
