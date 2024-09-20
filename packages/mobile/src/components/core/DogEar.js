import { DogEarType } from '@audius/common/models';
import { View } from 'react-native';
import { IconCart, IconCollectible, IconSpecialAccess } from '@audius/harmony-native';
import DogEarRectangle from 'app/assets/images/dogEarRectangle.svg';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useThemeColors } from 'app/utils/theme';
import { zIndex } from 'app/utils/zIndex';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        container: {
            position: 'absolute',
            top: -1,
            left: -1,
            zIndex: zIndex.DOG_EAR,
            width: spacing(12),
            height: spacing(12),
            overflow: 'hidden',
            borderRadius: spacing(2)
        },
        rectangle: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: spacing(12),
            height: spacing(12),
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 0
            },
            shadowOpacity: 0.25,
            shadowRadius: spacing(2),
            zIndex: zIndex.DOG_EAR
        },
        icon: {
            position: 'absolute',
            width: spacing(4),
            height: spacing(4),
            top: spacing(1),
            left: spacing(1),
            zIndex: zIndex.DOG_EAR
        }
    });
});
export var DogEar = function (props) {
    var _a;
    var borderOffset = props.borderOffset, type = props.type, style = props.style;
    var styles = useStyles();
    var _b = useThemeColors(), staticWhite = _b.staticWhite, accentBlue = _b.accentBlue, specialLightGreen = _b.specialLightGreen;
    var _c = (_a = {},
        _a[DogEarType.COLLECTIBLE_GATED] = {
            icon: IconCollectible,
            colors: [accentBlue, accentBlue]
        },
        _a[DogEarType.SPECIAL_ACCESS] = {
            icon: IconSpecialAccess,
            colors: [accentBlue, accentBlue]
        },
        _a[DogEarType.USDC_PURCHASE] = {
            icon: IconCart,
            colors: [specialLightGreen, specialLightGreen]
        },
        _a)[type], Icon = _c.icon, colors = _c.colors;
    var borderOffsetStyle = borderOffset
        ? { left: -borderOffset, top: -borderOffset }
        : undefined;
    return (<View style={[styles.container, borderOffsetStyle, style]}>
      <DogEarRectangle fill={colors[0]} style={styles.rectangle}/>
      <Icon width={spacing(4)} height={spacing(4)} fill={staticWhite} style={styles.icon}/>
    </View>);
};
