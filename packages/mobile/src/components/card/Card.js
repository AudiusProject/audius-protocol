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
import { Text, View } from 'react-native';
import { Tile } from 'app/components/core';
import UserBadges from 'app/components/user-badges/UserBadges';
import { flexRowCentered, makeStyles } from 'app/styles';
import { CollectionDownloadStatusIndicator } from '../offline-downloads/CollectionDownloadStatusIndicator';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, typography = _a.typography, spacing = _a.spacing;
    return ({
        cardContent: {
            paddingHorizontal: spacing(2)
        },
        cardImage: {
            borderRadius: 6,
            height: 152,
            width: 152,
            marginTop: spacing(2),
            alignSelf: 'center'
        },
        userImage: {
            borderRadius: 152 / 2,
            backgroundColor: '#ddd'
        },
        textContainer: {
            paddingVertical: spacing(1)
        },
        primaryTextContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        },
        primaryText: __assign(__assign({}, typography.h3), { marginBottom: 0, color: palette.neutral, textAlign: 'center', 
            // needed to keep emojis from increasing text height
            lineHeight: 24, height: 24 }),
        secondaryText: __assign(__assign({}, typography.body2), { color: palette.neutral, marginHorizontal: spacing(1), textAlign: 'center' }),
        secondaryTextContainer: __assign(__assign({}, flexRowCentered()), { justifyContent: 'center' })
    });
});
export var Card = function (props) {
    var onPress = props.onPress, primaryText = props.primaryText, renderImage = props.renderImage, secondaryText = props.secondaryText, style = props.style, stylesProp = props.styles, _a = props.TileProps, TileProps = _a === void 0 ? {} : _a;
    var styles = useStyles();
    return (<Tile onPress={onPress} styles={{ root: style, content: styles.cardContent }} {...TileProps}>
      {renderImage({
            style: [styles.cardImage, props.type === 'user' && styles.userImage]
        })}
      <View style={styles.textContainer}>
        <View style={styles.primaryTextContainer}>
          <Text numberOfLines={1} style={[styles.primaryText, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.primaryText]}>
            {primaryText}
          </Text>
          {props.type === 'user' ? (<UserBadges user={props.user} badgeSize={12} hideName/>) : null}
        </View>
        <View style={styles.secondaryTextContainer}>
          <Text numberOfLines={1} style={[styles.secondaryText, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.secondaryText]}>
            {secondaryText}
          </Text>
          {props.type === 'collection' ? (<CollectionDownloadStatusIndicator size='s' collectionId={props.id}/>) : null}
        </View>
      </View>
    </Tile>);
};
