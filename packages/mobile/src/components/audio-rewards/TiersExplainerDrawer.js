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
import { useSelectTierInfo } from '@audius/common/hooks';
import { profilePageSelectors, badgeTiers } from '@audius/common/store';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { makeStyles } from 'app/styles';
import { IconAudioBadge } from '../core/IconAudioBadge';
import { AppDrawer } from '../drawer/AppDrawer';
import { TierText } from './TierText';
var getProfileUserId = profilePageSelectors.getProfileUserId;
export var MODAL_NAME = 'TiersExplainer';
var messages = {
    tier: 'Tier',
    explainer1: 'Unlock $AUDIO VIP Tiers by simply holding more $AUDIO.',
    explainer2: 'Advancing to a new tier will earn you a profile badge, visible throughout the app, and unlock various new features, as they are released.',
    learnMore: 'LEARN MORE'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, typography = _a.typography, palette = _a.palette;
    return ({
        top: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: spacing(12)
        },
        tierTextGroup: { marginLeft: spacing(4) },
        tierRank: __assign(__assign({}, typography.h2), { marginBottom: 0, color: palette.neutralLight6, textTransform: 'uppercase', letterSpacing: 3 }),
        tierText: {
            fontSize: 28,
            textTransform: 'uppercase',
            marginTop: spacing(0.5),
            marginBottom: spacing(1)
        },
        minAudio: __assign(__assign({}, typography.h3), { marginBottom: 0, color: palette.secondary }),
        explainerRoot: {
            marginTop: spacing(6),
            paddingHorizontal: spacing(12)
        },
        tierExplainer: {
            fontSize: 16,
            fontFamily: typography.fontByWeight.demiBold,
            color: palette.neutral,
            lineHeight: 25,
            marginBottom: spacing(7)
        }
    });
});
export var TiersExplainerDrawer = function () {
    var styles = useStyles();
    var profileId = useSelector(getProfileUserId);
    var _a = useSelectTierInfo(profileId), tier = _a.tier, tierNumber = _a.tierNumber;
    var minAudio = badgeTiers.find(function (tierReq) { return tierReq.tier === tier; }).minAudio;
    var minAudioText = minAudio.toString();
    return (<AppDrawer modalName={MODAL_NAME}>
      <View style={styles.top}>
        <IconAudioBadge tier={tier} height={108} width={108}/>
        <View style={styles.tierTextGroup}>
          <Text style={styles.tierRank}>
            {messages.tier} {tierNumber}
          </Text>
          <TierText style={styles.tierText} tier={tier}>
            {tier}
          </TierText>
          <Text accessibilityLabel={"".concat(minAudioText, " or more audio tokens")} style={styles.minAudio}>
            {minAudio.toString()}+ $AUDIO
          </Text>
        </View>
      </View>
      <View style={styles.explainerRoot}>
        <Text style={styles.tierExplainer}>{messages.explainer1}</Text>
        <Text style={styles.tierExplainer}>{messages.explainer2}</Text>
      </View>
    </AppDrawer>);
};
