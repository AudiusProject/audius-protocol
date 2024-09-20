import { useCallback } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { View, TouchableOpacity } from 'react-native';
import { Text, IconCopy } from '@audius/harmony-native';
import { useToast } from 'app/hooks/useToast';
import { make, track as trackEvent } from 'app/services/analytics';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useColor } from 'app/utils/theme';
var messages = {
    copied: 'Copied to Clipboard!'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        root: {
            borderWidth: 1,
            borderColor: palette.borderDefault,
            borderRadius: spacing(1),
            flexDirection: 'column'
        },
        topContainer: {
            padding: spacing(4),
            flexDirection: 'row',
            gap: spacing(2),
            alignItems: 'center',
            justifyContent: 'center'
        },
        title: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
        },
        bottomContainer: {
            borderTopWidth: 1,
            flexDirection: 'row',
            gap: spacing(2),
            borderColor: palette.borderDefault,
            backgroundColor: palette.backgroundSurface
        },
        address: {
            paddingVertical: spacing(4),
            paddingHorizontal: spacing(6),
            flexShrink: 1
        },
        rightIcon: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing(6),
            paddingVertical: spacing(4),
            borderLeftWidth: 1,
            borderLeftColor: palette.borderDefault
        }
    });
});
export var AddressTile = function (_a) {
    var address = _a.address, title = _a.title, balance = _a.balance, left = _a.left, right = _a.right, analytics = _a.analytics;
    var styles = useStyles();
    var toast = useToast().toast;
    var textSubdued = useColor('textIconSubdued');
    var handleCopyPress = useCallback(function () {
        Clipboard.setString(address);
        toast({ content: messages.copied, type: 'info' });
        if (analytics)
            trackEvent(make(analytics));
    }, [address, analytics, toast]);
    return (<View style={styles.root}>
      <View style={styles.topContainer}>
        <View>{left}</View>
        <Text style={styles.title} variant='title' size='m' strength='default'>
          {title}
        </Text>
        <Text variant='title' size='l' strength='strong'>{"$".concat(balance)}</Text>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.address}>
          <Text variant='body' numberOfLines={1} ellipsizeMode='middle'>
            {address}
          </Text>
        </View>
        <View style={styles.rightIcon}>
          {right !== null && right !== void 0 ? right : (<TouchableOpacity onPress={handleCopyPress} hitSlop={spacing(6)}>
              <IconCopy fill={textSubdued} width={spacing(4)} height={spacing(4)}/>
            </TouchableOpacity>)}
        </View>
      </View>
    </View>);
};
