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
import { useMemo } from 'react';
import { Platform, Text as RNText } from 'react-native';
import { makeStyles, typography } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useThemePalette } from 'app/utils/theme';
var useStyles = makeStyles(function (_a) {
    var typography = _a.typography, palette = _a.palette;
    return ({
        root: {
            color: palette.neutral,
            fontSize: typography.fontSize.medium,
            fontFamily: typography.fontByWeight.medium
        }
    });
});
export var Text = function (props) {
    var variantProp = props.variant, noGutter = props.noGutter, style = props.style, _a = props.color, color = _a === void 0 ? 'neutral' : _a, colorValue = props.colorValue, weight = props.weight, fontSizeProp = props.fontSize, textTransform = props.textTransform, childrenProp = props.children, allowNewline = props.allowNewline, other = __rest(props, ["variant", "noGutter", "style", "color", "colorValue", "weight", "fontSize", "textTransform", "children", "allowNewline"]);
    var variant = variantProp !== null && variantProp !== void 0 ? variantProp : 'body';
    var fontSize = !fontSizeProp && !variantProp ? 'medium' : fontSizeProp;
    var styles = useStyles();
    var palette = useThemePalette();
    var customStyles = useMemo(function () { return [
        typography[variant],
        color !== 'inherit' && {
            color: color === 'error'
                ? palette.accentRed
                : color === 'warning'
                    ? palette.accentOrange
                    : colorValue !== null && colorValue !== void 0 ? colorValue : palette[color]
        },
        weight && {
            fontFamily: typography.fontByWeight[weight],
            // Fix for demibold's weird positioning
            marginTop: weight === 'demiBold' && Platform.OS === 'ios'
                ? spacing(fontSize && ['xl', 'large'].includes(fontSize)
                    ? 1
                    : fontSize === 'small'
                        ? 0.5
                        : 0)
                : undefined
        },
        fontSize &&
            fontSize !== 'inherit' && { fontSize: typography.fontSize[fontSize] },
        noGutter && { marginBottom: 0 },
        { textTransform: textTransform }
    ]; }, [
        variant,
        color,
        palette,
        colorValue,
        weight,
        fontSize,
        noGutter,
        textTransform
    ]);
    var children = typeof childrenProp === 'string' && !allowNewline
        ? childrenProp.replace('\n', ' ')
        : childrenProp;
    return (<RNText style={[styles.root, customStyles, style]} {...other}>
      {children}
    </RNText>);
};
