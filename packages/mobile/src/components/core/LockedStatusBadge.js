import { View } from 'react-native';
import { IconLock, IconLockUnlocked } from '@audius/harmony-native';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useColor } from 'app/utils/theme';
import { Text } from './Text';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        root: {
            backgroundColor: palette.accentBlue,
            paddingHorizontal: spacing(2),
            paddingVertical: 1,
            borderRadius: spacing(10),
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing(1),
            flexDirection: 'row'
        },
        premium: {
            backgroundColor: palette.specialLightGreen
        },
        locked: {
            backgroundColor: palette.neutralLight4
        }
    });
});
/** Renders a small badge with locked or unlocked icon */
export var LockedStatusBadge = function (_a) {
    var locked = _a.locked, _b = _a.variant, variant = _b === void 0 ? 'gated' : _b, text = _a.text, _c = _a.coloredWhenLocked, coloredWhenLocked = _c === void 0 ? false : _c, _d = _a.iconSize, iconSize = _d === void 0 ? 'medium' : _d;
    var styles = useStyles();
    var staticWhite = useColor('staticWhite');
    var LockComponent = locked ? IconLock : IconLockUnlocked;
    return (<View style={[
            styles.root,
            locked && !coloredWhenLocked
                ? styles.locked
                : variant === 'purchase'
                    ? styles.premium
                    : null
        ]}>
      <LockComponent fill={staticWhite} width={iconSize === 'medium' ? spacing(3.5) : spacing(3)} height={iconSize === 'medium' ? spacing(3.5) : spacing(3)}/>
      {text ? (<Text fontSize='xs' variant='label' color='staticWhite'>
          {text}
        </Text>) : null}
    </View>);
};
