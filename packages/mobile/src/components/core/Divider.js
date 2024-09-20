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
import { View } from 'react-native';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        horizontal: {
            borderBottomColor: palette.neutralLight8,
            borderBottomWidth: 1
        },
        vertical: {
            borderRightColor: palette.neutralLight8,
            borderRightWidth: 1
        }
    });
});
export var Divider = function (props) {
    var _a, _b;
    var style = props.style, _c = props.orientation, orientation = _c === void 0 ? 'horizontal' : _c, width = props.width, color = props.color, other = __rest(props, ["style", "orientation", "width", "color"]);
    var styles = useStyles();
    var positionStyle = orientation === 'horizontal' ? 'borderBottom' : 'borderRight';
    return (<View style={[
            orientation === 'horizontal' ? styles.horizontal : styles.vertical,
            style,
            width ? (_a = {}, _a["".concat(positionStyle, "Width")] = width, _a) : null,
            color ? (_b = {}, _b["".concat(positionStyle, "Color")] = color, _b) : null
        ]} {...other}/>);
};
