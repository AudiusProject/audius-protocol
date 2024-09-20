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
import { useCallback, useRef } from 'react';
import { Pressable as RNPressable } from 'react-native';
var scrollThreshold = 2;
export var Pressable = function (props) {
    var onPress = props.onPress, onPressIn = props.onPressIn, other = __rest(props, ["onPress", "onPressIn"]);
    var activeTouchPositionRef = useRef(null);
    var handlePressIn = useCallback(function (event) {
        var _a = event.nativeEvent, pageX = _a.pageX, pageY = _a.pageY;
        activeTouchPositionRef.current = {
            pageX: pageX,
            pageY: pageY
        };
        onPressIn === null || onPressIn === void 0 ? void 0 : onPressIn(event);
    }, [onPressIn]);
    var handlePress = useCallback(function (event) {
        if (!activeTouchPositionRef.current)
            return;
        var current = activeTouchPositionRef.current;
        var _a = event.nativeEvent, pageX = _a.pageX, pageY = _a.pageY;
        var dx = Math.abs(current.pageX - pageX);
        var dy = Math.abs(current.pageY - pageY);
        var dragged = dx > scrollThreshold || dy > scrollThreshold;
        if (!dragged) {
            onPress === null || onPress === void 0 ? void 0 : onPress(event);
        }
    }, [onPress]);
    return (<RNPressable onPress={handlePress} onPressIn={handlePressIn} {...other}/>);
};
