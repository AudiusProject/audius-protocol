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
import { useCallback } from 'react';
import { Animated, View } from 'react-native';
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation';
import { shadow, makeStyles } from 'app/styles';
import { Pressable } from '../Pressable';
var borderRadius = 8;
var shadowStyles = shadow();
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        tile: __assign({ flexDirection: 'row', borderColor: palette.neutralLight8, backgroundColor: palette.white, borderWidth: 1, borderRadius: borderRadius }, shadowStyles),
        content: {
            flex: 1
        }
    });
});
var defaultElement = View;
export var Tile = function (props) {
    var styles = useStyles();
    var _a = props.as, TileComponent = _a === void 0 ? defaultElement : _a, children = props.children, onPress = props.onPress, onPressIn = props.onPressIn, onPressOut = props.onPressOut, style = props.style, stylesProp = props.styles, scaleTo = props.scaleTo, pointerEvents = props.pointerEvents, other = __rest(props, ["as", "children", "onPress", "onPressIn", "onPressOut", "style", "styles", "scaleTo", "pointerEvents"]);
    var _b = usePressScaleAnimation(scaleTo), scale = _b.scale, handlePressInScale = _b.handlePressIn, handlePressOutScale = _b.handlePressOut;
    var handlePressIn = useCallback(function (event) {
        onPressIn === null || onPressIn === void 0 ? void 0 : onPressIn(event);
        if (onPress) {
            handlePressInScale();
        }
    }, [onPressIn, onPress, handlePressInScale]);
    var handlePressOut = useCallback(function (event) {
        onPressOut === null || onPressOut === void 0 ? void 0 : onPressOut(event);
        if (onPress) {
            handlePressOutScale();
        }
    }, [onPressOut, onPress, handlePressOutScale]);
    return (<Animated.View style={[style, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root, { transform: [{ scale: scale }] }]}>
      <TileComponent style={[styles.tile, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.tile]} {...other}>
        <Pressable pointerEvents={pointerEvents} style={[styles.content, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.content, { borderRadius: 4 }]} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          {children}
        </Pressable>
      </TileComponent>
    </Animated.View>);
};
