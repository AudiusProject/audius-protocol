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
import { useCallback } from 'react';
import { audioRewardsPageActions, modalsActions } from '@audius/common/store';
import { Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { IconCrown } from '@audius/harmony-native';
import { Tile } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
var setVisibility = modalsActions.setVisibility;
var setTrendingRewardsModalType = audioRewardsPageActions.setTrendingRewardsModalType;
var messages = {
    rewards: '$audio rewards',
    tracks: 'top 5 tracks each week win $audio',
    playlists: 'top 5 playlists each week win $audio',
    underground: 'top 5 tracks each week win $audio',
    learnMore: 'learn more'
};
var useStyles = makeStyles(function (_a) {
    var typography = _a.typography, palette = _a.palette, spacing = _a.spacing;
    return ({
        root: {
            marginTop: spacing(3),
            marginHorizontal: spacing(3)
        },
        tile: {
            borderWidth: 0
        },
        tileContent: {
            marginVertical: spacing(2),
            alignItems: 'center'
        },
        iconCrown: {
            fill: palette.staticWhite,
            height: 22,
            width: 22,
            marginRight: spacing(1)
        },
        title: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing(1)
        },
        titleText: {
            fontSize: 20,
            fontFamily: typography.fontByWeight.heavy,
            color: palette.staticWhite,
            textTransform: 'uppercase'
        },
        descriptionText: __assign(__assign({}, typography.h2), { marginBottom: 0, color: palette.staticWhite, textTransform: 'uppercase' })
    });
});
export var RewardsBanner = function (props) {
    var type = props.type;
    var styles = useStyles();
    var dispatch = useDispatch();
    var _a = useThemeColors(), pageHeaderGradientColor1 = _a.pageHeaderGradientColor1, pageHeaderGradientColor2 = _a.pageHeaderGradientColor2;
    var handlePress = useCallback(function () {
        dispatch(setTrendingRewardsModalType({ modalType: type }));
        dispatch(setVisibility({ modal: 'TrendingRewardsExplainer', visible: true }));
    }, [dispatch, type]);
    return (<Tile as={LinearGradient} colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} styles={{
            root: styles.root,
            tile: styles.tile,
            content: styles.tileContent
        }} onPress={handlePress}>
      <View style={styles.title}>
        <IconCrown style={styles.iconCrown} fill={styles.iconCrown.fill} height={styles.iconCrown.height} width={styles.iconCrown.width}/>
        <Text style={styles.titleText}>{messages.rewards}</Text>
      </View>
      <Text style={styles.descriptionText}>{messages[type]}</Text>
    </Tile>);
};
