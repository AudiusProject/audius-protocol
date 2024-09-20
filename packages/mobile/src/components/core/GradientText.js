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
import Text from 'app/components/text';
import { useThemeColors } from 'app/utils/theme';
/**
 * Diagonal gradient text in the Audius colors
 */
export var GradientText = function (props) {
    var _a = useThemeColors(), pageHeaderGradientColor1 = _a.pageHeaderGradientColor1, pageHeaderGradientColor2 = _a.pageHeaderGradientColor2;
    var style = props.style, children = props.children, _b = props.colors, colors = _b === void 0 ? [pageHeaderGradientColor1, pageHeaderGradientColor2] : _b, other = __rest(props, ["style", "children", "colors"]);
    return (<MaskedView maskElement={<Text style={style} weight='heavy' {...other}>
          {children}
        </Text>}>
      <LinearGradient colors={colors} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }}>
        <Text style={[style, { opacity: 0 }]} weight='heavy' {...other}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>);
};
