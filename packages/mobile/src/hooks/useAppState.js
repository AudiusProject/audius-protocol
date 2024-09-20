import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
var NotActive = /inactive|background/g;
export var useAppState = function (onEnterForeground, onEnterBackground) {
    var _a = useState(AppState.currentState), appState = _a[0], setAppState = _a[1];
    var handleAppStateChange = useCallback(function (nextAppState) {
        if (appState.match(NotActive) &&
            nextAppState === 'active' &&
            onEnterForeground) {
            console.info('Enter foreground');
            onEnterForeground();
        }
        if (appState === 'active' &&
            nextAppState.match(NotActive) &&
            onEnterBackground) {
            console.info('Enter background');
            onEnterBackground();
        }
        setAppState(nextAppState);
    }, [appState, onEnterForeground, onEnterBackground]);
    useEffect(function () {
        var subscription = AppState.addEventListener('change', handleAppStateChange);
        return function () { return subscription.remove(); };
    }, [handleAppStateChange]);
    return appState;
};
export var useEnterForeground = function (onEnterForeground) {
    return useAppState(onEnterForeground, null);
};
export var useEnterBackground = function (onEnterBackground) {
    return useAppState(null, onEnterBackground);
};
export default useAppState;
