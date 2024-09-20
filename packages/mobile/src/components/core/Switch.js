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
import { Platform, Switch as RNSwitch } from 'react-native';
import { useToggle } from 'react-use';
import { light } from 'app/haptics';
import { useThemeColors } from 'app/utils/theme';
var switchStyle = Platform.OS === 'ios' && {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }]
};
export var Switch = function (props) {
    var _a = props.defaultValue, defaultValue = _a === void 0 ? false : _a, value = props.value, onValueChangeProp = props.onValueChange, styleProp = props.style, _b = props.isDisabled, isDisabled = _b === void 0 ? false : _b, other = __rest(props, ["defaultValue", "value", "onValueChange", "style", "isDisabled"]);
    var _c = useThemeColors(), neutralLight6 = _c.neutralLight6, white = _c.white, secondary = _c.secondary;
    var _d = useToggle(defaultValue), isOnState = _d[0], setIsOn = _d[1];
    var isOn = value !== null && value !== void 0 ? value : isOnState;
    var handleValueChange = useCallback(function (value) {
        onValueChangeProp === null || onValueChangeProp === void 0 ? void 0 : onValueChangeProp(value);
        setIsOn(value);
        light();
    }, [onValueChangeProp, setIsOn]);
    return (<RNSwitch style={[switchStyle, styleProp]} trackColor={{ false: neutralLight6, true: secondary }} thumbColor={white} value={isOn} onValueChange={handleValueChange} disabled={isDisabled} {...other}/>);
};
