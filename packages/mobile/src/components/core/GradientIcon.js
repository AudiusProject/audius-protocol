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
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { useThemeColors } from 'app/utils/theme';
export var GradientIcon = function (props) {
    var Icon = props.icon, other = __rest(props, ["icon"]);
    var _a = useThemeColors(), pageHeaderGradientColor1 = _a.pageHeaderGradientColor1, pageHeaderGradientColor2 = _a.pageHeaderGradientColor2;
    return (<MaskedView maskElement={<Icon {...other} fill='white'/>}>
      <LinearGradient colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }}>
        <Icon {...other} fill='transparent'/>
      </LinearGradient>
    </MaskedView>);
};
