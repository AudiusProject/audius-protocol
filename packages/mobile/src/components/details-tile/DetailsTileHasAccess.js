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
import { useStreamConditionsEntity } from '@audius/common/hooks';
import { isContentCollectibleGated, isContentFollowGated, isContentTipGated, isContentUSDCPurchaseGated } from '@audius/common/models';
import { formatPrice } from '@audius/common/utils';
import { View } from 'react-native';
import { Flex, IconCart, IconCollectible, IconSpecialAccess } from '@audius/harmony-native';
import { LockedStatusBadge, Text, useLink } from 'app/components/core';
import UserBadges from 'app/components/user-badges';
import { useNavigation } from 'app/hooks/useNavigation';
import { flexRowCentered, makeStyles } from 'app/styles';
import { useColor } from 'app/utils/theme';
var messages = {
    unlocked: 'UNLOCKED',
    collectibleGated: 'COLLECTIBLE GATED',
    specialAccess: 'SPECIAL ACCESS',
    payToUnlock: 'Pay to Unlock',
    unlockedCollectibleGatedPrefix: 'A Collectible from ',
    unlockedCollectibleGatedSuffix: function (contentType) {
        return " was found in a linked wallet. This ".concat(contentType, " is now available.");
    },
    ownerCollectibleGatedPrefix: 'Users can unlock access by linking a wallet containing a collectible from ',
    unlockedFollowGatedPrefix: 'Thank you for following ',
    unlockedFollowGatedSuffix: function (contentType) {
        return "! This ".concat(contentType, " is now available.");
    },
    ownerFollowGated: 'Users can unlock access by following your account!',
    unlockedTipGatedPrefix: 'Thank you for supporting ',
    unlockedTipGatedSuffix: function (contentType) {
        return " by sending them a tip! This ".concat(contentType, " is now available.");
    },
    ownerTipGated: 'Users can unlock access by sending you a tip!',
    unlockedUSDCPurchasePrefix: function (contentType) {
        return "You've purchased this ".concat(contentType, ". Thank you for supporting ");
    },
    unlockedUSDCPurchaseSuffix: '.',
    ownerUSDCPurchase: function (_a) {
        var price = _a.price, contentType = _a.contentType;
        return "Users can unlock access to this ".concat(contentType, " for a one time purchase of $").concat(price);
    }
};
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        titleContainer: __assign(__assign({}, flexRowCentered()), { justifyContent: 'space-between', gap: spacing(2) }),
        ownerTitleContainer: {
            justifyContent: 'flex-start'
        },
        title: {
            fontFamily: typography.fontByWeight.heavy,
            fontSize: typography.fontSize.medium,
            color: palette.neutral,
            textTransform: 'uppercase'
        },
        descriptionContainer: __assign(__assign({}, flexRowCentered()), { flexWrap: 'wrap' }),
        description: {
            flexShrink: 0,
            fontFamily: typography.fontByWeight.demiBold,
            fontSize: typography.fontSize.medium,
            color: palette.neutral,
            lineHeight: typography.fontSize.medium * 1.3
        },
        name: {
            color: palette.secondary
        }
    });
});
var DetailsTileOwnerSection = function (_a) {
    var _b;
    var streamConditions = _a.streamConditions, handlePressCollection = _a.handlePressCollection, contentType = _a.contentType;
    var styles = useStyles();
    var neutral = useColor('neutral');
    if (isContentCollectibleGated(streamConditions)) {
        return (<Flex p='l' gap='s' backgroundColor='white' border='strong' borderRadius='m'>
        <View style={[styles.titleContainer, styles.ownerTitleContainer]}>
          <IconCollectible fill={neutral} width={16} height={16}/>
          <Text style={styles.title}>{messages.collectibleGated}</Text>
        </View>
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.ownerCollectibleGatedPrefix}
            </Text>
            <Text onPress={handlePressCollection} style={[styles.description, styles.name]}>
              {(_b = streamConditions.nft_collection) === null || _b === void 0 ? void 0 : _b.name}
            </Text>
          </Text>
        </View>
      </Flex>);
    }
    if (isContentFollowGated(streamConditions) ||
        isContentTipGated(streamConditions)) {
        return (<Flex p='l' gap='s' backgroundColor='white' border='strong' borderRadius='m'>
        <View style={[styles.titleContainer, styles.ownerTitleContainer]}>
          <IconSpecialAccess fill={neutral} width={16} height={16}/>
          <Text style={styles.title}>{messages.specialAccess}</Text>
        </View>
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {isContentFollowGated(streamConditions)
                ? messages.ownerFollowGated
                : messages.ownerTipGated}
            </Text>
          </Text>
        </View>
      </Flex>);
    }
    if (isContentUSDCPurchaseGated(streamConditions)) {
        return (<Flex p='l' gap='s' backgroundColor='white' border='strong' borderRadius='m'>
        <View style={[styles.titleContainer, styles.ownerTitleContainer]}>
          <IconCart fill={neutral} width={16} height={16}/>
          <Text style={styles.title}>{messages.payToUnlock}</Text>
        </View>
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.ownerUSDCPurchase({
                price: formatPrice(streamConditions.usdc_purchase.price),
                contentType: contentType
            })}
            </Text>
          </Text>
        </View>
      </Flex>);
    }
    return null;
};
export var DetailsTileHasAccess = function (_a) {
    var streamConditions = _a.streamConditions, isOwner = _a.isOwner, style = _a.style, trackArtist = _a.trackArtist, contentType = _a.contentType;
    var styles = useStyles();
    var navigation = useNavigation();
    var _b = useStreamConditionsEntity(streamConditions), nftCollection = _b.nftCollection, collectionLink = _b.collectionLink, followee = _b.followee, tippedUser = _b.tippedUser;
    var handlePressCollection = useLink(collectionLink).onPress;
    var handlePressArtistName = useCallback(function (handle) { return function () {
        navigation.push('Profile', { handle: handle });
    }; }, [navigation]);
    var renderUnlockedSpecialAccessDescription = useCallback(function (args) {
        var entity = args.entity, prefix = args.prefix, suffix = args.suffix;
        return (<View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>{prefix}</Text>
            <Text style={[styles.description, styles.name]} onPress={handlePressArtistName(entity.handle)}>
              {entity.name}
            </Text>
            <UserBadges badgeSize={16} user={entity} nameStyle={styles.description} hideName/>
            <Text style={styles.description}>{suffix}</Text>
          </Text>
        </View>);
    }, [styles, handlePressArtistName]);
    var renderUnlockedDescription = useCallback(function () {
        if (isContentCollectibleGated(streamConditions)) {
            if (!nftCollection)
                return null;
            return (<View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.unlockedCollectibleGatedPrefix}
            </Text>
            <Text style={[styles.description, styles.name]} onPress={handlePressCollection}>
              {nftCollection.name}
            </Text>
            <Text style={styles.description}>
              {messages.unlockedCollectibleGatedSuffix(contentType)}
            </Text>
          </Text>
        </View>);
        }
        if (isContentFollowGated(streamConditions)) {
            if (!followee)
                return null;
            return renderUnlockedSpecialAccessDescription({
                entity: followee,
                prefix: messages.unlockedFollowGatedPrefix,
                suffix: messages.unlockedFollowGatedSuffix(contentType)
            });
        }
        if (isContentTipGated(streamConditions)) {
            if (!tippedUser)
                return null;
            return renderUnlockedSpecialAccessDescription({
                entity: tippedUser,
                prefix: messages.unlockedTipGatedPrefix,
                suffix: messages.unlockedTipGatedSuffix(contentType)
            });
        }
        if (isContentUSDCPurchaseGated(streamConditions)) {
            if (!trackArtist)
                return null;
            return renderUnlockedSpecialAccessDescription({
                entity: trackArtist,
                prefix: messages.unlockedUSDCPurchasePrefix(contentType),
                suffix: messages.unlockedUSDCPurchaseSuffix
            });
        }
        return null;
    }, [
        streamConditions,
        nftCollection,
        styles.descriptionContainer,
        styles.description,
        styles.name,
        handlePressCollection,
        followee,
        renderUnlockedSpecialAccessDescription,
        tippedUser,
        trackArtist,
        contentType
    ]);
    if (isOwner) {
        return (<DetailsTileOwnerSection streamConditions={streamConditions} handlePressCollection={handlePressCollection} contentType={contentType}/>);
    }
    return (<Flex p='l' gap='s' backgroundColor='white' border='strong' borderRadius='m' style={style}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{messages.unlocked}</Text>
        <LockedStatusBadge locked={false} variant={isContentUSDCPurchaseGated(streamConditions) ? 'purchase' : 'gated'}/>
      </View>
      {renderUnlockedDescription()}
    </Flex>);
};
