var _a;
import { StyleSheet, View } from 'react-native';
import { IconCosign } from '@audius/harmony-native';
import { useThemeColors } from 'app/utils/theme';
import { Size } from './types';
var styles = StyleSheet.create({
    check: {
        position: 'absolute'
    }
});
var layoutBySize = (_a = {},
    _a[Size.TINY] = {
        position: {
            bottom: 2,
            right: -2
        },
        size: {
            height: 10,
            width: 10
        }
    },
    _a[Size.SMALL] = {
        position: {
            bottom: -4,
            right: -5
        },
        size: {
            height: 16,
            width: 16
        }
    },
    _a[Size.MEDIUM] = {
        position: {
            bottom: -3,
            right: -3
        },
        size: {
            height: 24,
            width: 24
        }
    },
    _a[Size.LARGE] = {
        position: {
            bottom: -8,
            right: -8
        },
        size: {
            height: 32,
            width: 32
        }
    },
    _a[Size.XLARGE] = {
        position: {
            bottom: -7,
            right: -7
        },
        size: {
            height: 44,
            width: 44
        }
    },
    _a);
var CoSign = function (_a) {
    var size = _a.size, children = _a.children, style = _a.style;
    var _b = useThemeColors(), primary = _b.primary, staticWhite = _b.staticWhite;
    var _c = layoutBySize[size], iconSize = _c.size, position = _c.position;
    return (<View style={style}>
      <View>{children}</View>
      <View style={[styles.check, position]}>
        <IconCosign fill={primary} fillSecondary={staticWhite} {...iconSize}/>
      </View>
    </View>);
};
export default CoSign;
