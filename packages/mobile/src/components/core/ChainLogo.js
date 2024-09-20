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
import { View } from 'react-native';
import LogoEth from 'app/assets/images/logoEth.svg';
import LogoSol from 'app/assets/images/logoSol.svg';
import { makeStyles, shadow } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        root: __assign({ borderWidth: 1, borderColor: palette.neutralLight7, backgroundColor: palette.staticWhite, alignItems: 'center', justifyContent: 'center' }, shadow())
    });
});
export var ChainLogo = function (props) {
    var chain = props.chain, style = props.style, _a = props.size, size = _a === void 0 ? 24 : _a;
    var styles = useStyles();
    var rootStyle = [
        styles.root,
        style,
        { height: size, width: size, borderRadius: size / 2 }
    ];
    var solIconSize = size * (2 / 3);
    var ethIconSize = solIconSize * (9 / 8);
    return (<View style={rootStyle}>
      {chain === 'eth' ? (<LogoEth height={ethIconSize}/>) : (<LogoSol height={solIconSize}/>)}
    </View>);
};
