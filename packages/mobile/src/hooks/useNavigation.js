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
import { useCallback, useMemo } from 'react';
import { useNavigation as useNativeNavigation } from '@react-navigation/native';
import { isEqual } from 'lodash';
import { getNearestStackNavigator } from 'app/utils/navigation';
var lastNavAction;
export var setLastNavAction = function (action) {
    lastNavAction = action;
};
/**
 * Custom wrapper around react-navigation `useNavigation`
 *
 * Features:
 * - Prevent duplicate navigation pushes
 * - Apply contextual params to all routes
 */
export function useNavigation(options) {
    var _a;
    var defaultNavigation = useNativeNavigation();
    var navigation = (_a = options === null || options === void 0 ? void 0 : options.customNavigation) !== null && _a !== void 0 ? _a : defaultNavigation;
    // Prevent duplicate pushes by de-duping
    // navigation actions
    var performCustomPush = useCallback(function () {
        var config = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            config[_i] = arguments[_i];
        }
        if (!isEqual(lastNavAction, config)) {
            var stackNavigator = getNearestStackNavigator(navigation);
            if (stackNavigator) {
                stackNavigator.push.apply(stackNavigator, config);
                // Set lastNavAction, it will be reset via an event handler in AppTabScreen
                setLastNavAction(config);
            }
        }
    }, [navigation]);
    return useMemo(function () { return (__assign(__assign({}, navigation), { push: 'push' in navigation
            ? performCustomPush
            : function () {
                console.error('Push is not implemented for this navigator');
            } })); }, [navigation, performCustomPush]);
}
