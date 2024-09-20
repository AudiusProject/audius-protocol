import { useCallback } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { Animated, View, TouchableHighlight } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { IconCopy } from '@audius/harmony-native';
import Text from 'app/components/text';
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation';
import { useToast } from 'app/hooks/useToast';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
var messages = {
    copyPrompt: 'Copy Invite to Clipboard',
    copyNotice: 'Referral link copied to the clipboard'
};
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        copyPromptContainer: {
            width: '100%'
        },
        borderRadius: {
            borderRadius: 6
        },
        copyTextContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12
        },
        copyText: {
            fontSize: 18,
            textAlign: 'center',
            color: palette.staticWhite
        },
        iconCopy: {
            color: palette.staticWhite,
            lineHeight: 16,
            marginRight: 8
        }
    });
});
export var ReferralLinkCopyButton = function (_a) {
    var inviteUrl = _a.inviteUrl;
    var _b = useThemeColors(), pageHeaderGradientColor1 = _b.pageHeaderGradientColor1, pageHeaderGradientColor2 = _b.pageHeaderGradientColor2;
    var styles = useStyles();
    var toast = useToast().toast;
    var onCopyClicked = useCallback(function () {
        Clipboard.setString(inviteUrl);
        toast({ content: messages.copyNotice, type: 'info' });
    }, [inviteUrl, toast]);
    // Button animation
    var _c = usePressScaleAnimation(), scale = _c.scale, handlePressIn = _c.handlePressIn, handlePressOut = _c.handlePressOut;
    return (<Animated.View style={[styles.copyPromptContainer, { transform: [{ scale: scale }] }]}>
      <TouchableHighlight style={styles.borderRadius} onPress={onCopyClicked} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <LinearGradient style={[styles.borderRadius]} angleCenter={{ x: 0.5, y: 0.5 }} angle={350} useAngle={true} colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]} locations={[0.0204, 1]}>
          <View style={styles.copyTextContainer}>
            <IconCopy style={styles.iconCopy} width={24} height={24} color='staticWhite'/>
            <Text weight={'bold'} style={styles.copyText}>
              {messages.copyPrompt}
            </Text>
          </View>
        </LinearGradient>
      </TouchableHighlight>
    </Animated.View>);
};
