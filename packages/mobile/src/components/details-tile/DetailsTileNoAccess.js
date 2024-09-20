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
import { useFeatureFlag, useStreamConditionsEntity } from '@audius/common/hooks';
import { FollowSource, ModalSource, Chain, isContentCollectibleGated, isContentFollowGated, isContentTipGated, isContentUSDCPurchaseGated } from '@audius/common/models';
import { FeatureFlags } from '@audius/common/services';
import { PurchaseableContentType, usersSocialActions, tippingActions, usePremiumContentPurchaseModal, gatedContentSelectors } from '@audius/common/store';
import { formatPrice } from '@audius/common/utils';
import { Image, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { IconExternalLink, IconUserFollow, IconTipping, Flex, Button } from '@audius/harmony-native';
import LogoEth from 'app/assets/images/logoEth.svg';
import LogoSol from 'app/assets/images/logoSol.svg';
import { LockedStatusBadge, useLink } from 'app/components/core';
import LoadingSpinner from 'app/components/loading-spinner';
import UserBadges from 'app/components/user-badges';
import { useDrawer } from 'app/hooks/useDrawer';
import { useNavigation } from 'app/hooks/useNavigation';
import { make, track } from 'app/services/analytics';
import { flexRowCentered, makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { EventNames } from 'app/types/analytics';
var getGatedContentStatusMap = gatedContentSelectors.getGatedContentStatusMap;
var followUser = usersSocialActions.followUser;
var beginTip = tippingActions.beginTip;
var messages = {
    unlocking: 'UNLOCKING',
    howToUnlock: 'HOW TO UNLOCK',
    goToCollection: 'Go To Collection',
    followArtist: 'Follow Artist',
    sendTip: 'Send Tip',
    buy: function (price) { return "Buy $".concat(price); },
    lockedCollectibleGated: 'To unlock this track, you must link a wallet containing a collectible from:',
    unlockingCollectibleGatedPrefix: 'A Collectible from ',
    unlockingCollectibleGatedSuffix: ' was found in a linked wallet.',
    lockedFollowGatedPrefix: 'Follow ',
    unlockingFollowGatedPrefix: 'Thank you for following ',
    unlockingFollowGatedSuffix: '!',
    lockedTipGatedPrefix: 'Send ',
    lockedTipGatedSuffix: ' a tip.',
    unlockingTipGatedPrefix: 'Thank you for supporting ',
    unlockingTipGatedSuffix: ' by sending them a tip!',
    lockedUSDCPurchase: 'Unlock access with a one-time purchase!'
};
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        titleContainer: __assign(__assign({}, flexRowCentered()), { justifyContent: 'space-between' }),
        title: {
            fontFamily: typography.fontByWeight.heavy,
            fontSize: typography.fontSize.medium,
            color: palette.neutral
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
        },
        collectionContainer: __assign(__assign({}, flexRowCentered()), { marginTop: spacing(2), gap: spacing(6) }),
        collectionImages: __assign({}, flexRowCentered()),
        collectionImage: {
            borderWidth: 1,
            borderColor: palette.neutralLight7,
            borderRadius: spacing(1),
            width: spacing(8),
            height: spacing(8)
        },
        collectionChainImageContainer: {
            backgroundColor: palette.white,
            position: 'absolute',
            left: spacing(6),
            padding: spacing(1),
            width: spacing(6),
            height: spacing(6),
            borderWidth: 1,
            borderColor: palette.neutralLight7,
            borderRadius: spacing(4)
        },
        collectionChainImage: {
            top: -spacing(0.25),
            left: -spacing(1.25)
        },
        loadingSpinner: {
            width: spacing(5),
            height: spacing(5)
        }
    });
});
var DetailsTileNoAccessSection = function (_a) {
    var renderDescription = _a.renderDescription, streamConditions = _a.streamConditions, isUnlocking = _a.isUnlocking, style = _a.style;
    var styles = useStyles();
    return (<Flex p='l' gap='s' backgroundColor='white' border='strong' borderRadius='m' w='100%' style={style}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {isUnlocking ? messages.unlocking : messages.howToUnlock}
        </Text>
        {isUnlocking ? (<LoadingSpinner style={styles.loadingSpinner}/>) : (<LockedStatusBadge locked={true} variant={isContentUSDCPurchaseGated(streamConditions)
                ? 'purchase'
                : 'gated'}/>)}
      </View>
      {renderDescription()}
    </Flex>);
};
export var DetailsTileNoAccess = function (props) {
    var _a;
    var trackId = props.trackId, contentType = props.contentType, streamConditions = props.streamConditions, style = props.style;
    var styles = useStyles();
    var dispatch = useDispatch();
    var navigation = useNavigation();
    var _b = useDrawer('LockedContent'), isModalOpen = _b.isOpen, onClose = _b.onClose;
    var openPremiumContentPurchaseModal = usePremiumContentPurchaseModal().onOpen;
    var source = isModalOpen ? 'howToUnlockModal' : 'howToUnlockTrackPage';
    var followSource = isModalOpen
        ? FollowSource.HOW_TO_UNLOCK_MODAL
        : FollowSource.HOW_TO_UNLOCK_TRACK_PAGE;
    var gatedTrackStatusMap = useSelector(getGatedContentStatusMap);
    var gatedTrackStatus = (_a = gatedTrackStatusMap[trackId]) !== null && _a !== void 0 ? _a : null;
    var _c = useStreamConditionsEntity(streamConditions), nftCollection = _c.nftCollection, collectionLink = _c.collectionLink, followee = _c.followee, tippedUser = _c.tippedUser;
    var isUsdcPurchasesEnabled = useFeatureFlag(FeatureFlags.USDC_PURCHASES).isEnabled;
    var handlePressCollection = useLink(collectionLink).onPress;
    var handleFollowArtist = useCallback(function () {
        if (followee) {
            dispatch(followUser(followee.user_id, followSource, trackId));
        }
    }, [followee, dispatch, followSource, trackId]);
    var handleSendTip = useCallback(function () {
        onClose();
        dispatch(beginTip({ user: tippedUser, source: source, trackId: trackId }));
        navigation.navigate('TipArtist');
    }, [dispatch, tippedUser, source, trackId, navigation, onClose]);
    var handlePurchasePress = useCallback(function () {
        track(make({
            eventName: EventNames.PURCHASE_CONTENT_BUY_CLICKED,
            contentId: trackId,
            contentType: contentType
        }));
        onClose();
        openPremiumContentPurchaseModal({ contentId: trackId, contentType: contentType }, {
            source: contentType === PurchaseableContentType.ALBUM
                ? ModalSource.CollectionDetails
                : ModalSource.TrackDetails
        });
    }, [trackId, contentType, openPremiumContentPurchaseModal, onClose]);
    var handlePressArtistName = useCallback(function (handle) { return function () {
        navigation.push('Profile', { handle: handle });
    }; }, [navigation]);
    var renderLockedSpecialAccessDescription = useCallback(function (args) {
        var entity = args.entity, prefix = args.prefix, suffix = args.suffix;
        return (<View style={styles.descriptionContainer}>
          <Text style={styles.description}>{prefix}</Text>
          <Text style={[styles.description, styles.name]} onPress={handlePressArtistName(entity.handle)}>
            {entity.name}
          </Text>
          <UserBadges badgeSize={spacing(4)} user={entity} nameStyle={styles.description} hideName/>
          {suffix ? <Text style={styles.description}>{suffix}</Text> : null}
        </View>);
    }, [styles, handlePressArtistName]);
    var renderLockedDescription = useCallback(function () {
        if (isContentCollectibleGated(streamConditions)) {
            if (!nftCollection)
                return null;
            return (<>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {messages.lockedCollectibleGated}
            </Text>
            <View style={styles.collectionContainer}>
              {nftCollection.imageUrl && (<View style={styles.collectionImages}>
                  <Image source={{ uri: nftCollection.imageUrl }} style={styles.collectionImage}/>
                  <View style={styles.collectionChainImageContainer}>
                    {nftCollection.chain === Chain.Eth ? (<LogoEth style={styles.collectionChainImage} height={spacing(4)}/>) : (<LogoSol style={styles.collectionChainImage} height={spacing(4)}/>)}
                  </View>
                </View>)}
              <Text style={styles.description}>{nftCollection.name}</Text>
            </View>
          </View>
          <Button color='blue' iconRight={IconExternalLink} onPress={handlePressCollection} fullWidth>
            {messages.goToCollection}
          </Button>
        </>);
        }
        if (isContentFollowGated(streamConditions)) {
            if (!followee)
                return null;
            return (<>
          {renderLockedSpecialAccessDescription({
                    entity: followee,
                    prefix: messages.lockedFollowGatedPrefix
                })}
          <Button color='blue' iconLeft={IconUserFollow} onPress={handleFollowArtist} fullWidth>
            {messages.followArtist}
          </Button>
        </>);
        }
        if (isContentTipGated(streamConditions)) {
            if (!tippedUser)
                return null;
            return (<>
          {renderLockedSpecialAccessDescription({
                    entity: tippedUser,
                    prefix: messages.lockedTipGatedPrefix,
                    suffix: messages.lockedTipGatedSuffix
                })}
          <Button iconRight={IconTipping} onPress={handleSendTip} fullWidth>
            {messages.sendTip}
          </Button>
        </>);
        }
        if (isContentUSDCPurchaseGated(streamConditions)) {
            return (<>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {messages.lockedUSDCPurchase}
            </Text>
          </View>
          <Button color='lightGreen' onPress={handlePurchasePress} fullWidth>
            {messages.buy(formatPrice(streamConditions.usdc_purchase.price))}
          </Button>
        </>);
        }
        console.warn('No entity for stream conditions... should not have reached here.');
        return null;
    }, [
        streamConditions,
        nftCollection,
        styles.descriptionContainer,
        styles.description,
        styles.collectionContainer,
        styles.collectionImages,
        styles.collectionImage,
        styles.collectionChainImageContainer,
        styles.collectionChainImage,
        handlePressCollection,
        followee,
        renderLockedSpecialAccessDescription,
        handleFollowArtist,
        tippedUser,
        handleSendTip,
        handlePurchasePress
    ]);
    var renderUnlockingSpecialAccessDescription = useCallback(function (args) {
        var entity = args.entity, prefix = args.prefix, suffix = args.suffix;
        return (<View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>{prefix}</Text>
            <Text style={[styles.description, styles.name]} onPress={handlePressArtistName(entity.handle)}>
              {entity.name}
            </Text>
            <UserBadges badgeSize={spacing(4)} user={entity} nameStyle={styles.description} hideName/>
            <Text style={styles.description}>{suffix}</Text>
          </Text>
        </View>);
    }, [styles, handlePressArtistName]);
    var renderUnlockingDescription = useCallback(function () {
        if (nftCollection) {
            return (<View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.unlockingCollectibleGatedPrefix}
            </Text>
            <Text onPress={handlePressCollection} style={[styles.description, styles.name]}>
              {nftCollection.name}
            </Text>
            <Text style={styles.description}>
              {messages.unlockingCollectibleGatedSuffix}
            </Text>
          </Text>
        </View>);
        }
        if (followee) {
            return renderUnlockingSpecialAccessDescription({
                entity: followee,
                prefix: messages.unlockingFollowGatedPrefix,
                suffix: messages.unlockingFollowGatedSuffix
            });
        }
        if (tippedUser) {
            return renderUnlockingSpecialAccessDescription({
                entity: tippedUser,
                prefix: messages.unlockingTipGatedPrefix,
                suffix: messages.unlockingTipGatedSuffix
            });
        }
        console.warn('No entity for stream conditions... should not have reached here.');
        return null;
    }, [
        nftCollection,
        followee,
        tippedUser,
        handlePressCollection,
        renderUnlockingSpecialAccessDescription,
        styles
    ]);
    var isUnlocking = gatedTrackStatus === 'UNLOCKING';
    if (!isUsdcPurchasesEnabled && isContentUSDCPurchaseGated(streamConditions)) {
        return null;
    }
    return (<DetailsTileNoAccessSection renderDescription={isUnlocking ? renderUnlockingDescription : renderLockedDescription} streamConditions={streamConditions} isUnlocking={isUnlocking} style={style}/>);
};
