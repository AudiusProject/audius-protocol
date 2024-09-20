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
import { useState, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { useThemePalette } from 'app/utils/theme';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing;
    return ({
        root: { flexDirection: 'row', alignItems: 'center' },
        iconLeft: { marginRight: spacing(1) },
        iconRight: { marginLeft: spacing(1) },
        disabled: { color: palette.neutralLight7 },
        activeUnderline: { textDecorationLine: 'underline' }
    });
});
export var TextButton = function (props) {
    var activeUnderline = props.activeUnderline, title = props.title, variant = props.variant, Icon = props.icon, _a = props.iconPosition, iconPosition = _a === void 0 ? 'left' : _a, style = props.style, disabled = props.disabled, _b = props.showDisabled, showDisabled = _b === void 0 ? true : _b, TextProps = props.TextProps, IconProps = props.IconProps, stylesProp = props.styles, onPressIn = props.onPressIn, onPressOut = props.onPressOut, other = __rest(props, ["activeUnderline", "title", "variant", "icon", "iconPosition", "style", "disabled", "showDisabled", "TextProps", "IconProps", "styles", "onPressIn", "onPressOut"]);
    var styles = useStyles();
    var palette = useThemePalette();
    var _c = useState(false), isPressing = _c[0], setIsPressing = _c[1];
    var showDisabledColor = disabled && showDisabled;
    var icon = Icon ? (<Icon height={18} width={18} 
    // @ts-ignored currently restricted to react-native style interfaces
    fill={showDisabledColor ? styles.disabled.color : palette[variant]} style={[
            iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
            stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.icon
        ]} {...IconProps}/>) : null;
    var handlePressIn = useCallback(function () {
        setIsPressing(true);
        onPressIn === null || onPressIn === void 0 ? void 0 : onPressIn();
    }, [onPressIn]);
    var handlePressOut = useCallback(function () {
        setIsPressing(false);
        onPressOut === null || onPressOut === void 0 ? void 0 : onPressOut();
    }, [onPressOut]);
    return (<TouchableOpacity style={[styles.root, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root, style]} disabled={disabled} onPressIn={handlePressIn} onPressOut={handlePressOut} {...other}>
      {iconPosition === 'left' ? icon : null}
      <Text color={variant} style={[
            stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.text,
            showDisabledColor && styles.disabled,
            activeUnderline && isPressing && styles.activeUnderline
        ]} {...TextProps}>
        {title}
      </Text>
      {iconPosition === 'right' ? icon : null}
    </TouchableOpacity>);
};
