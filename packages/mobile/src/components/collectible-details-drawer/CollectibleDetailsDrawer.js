import { useCallback, useMemo } from 'react';
import { cacheUsersSelectors, collectibleDetailsUISelectors } from '@audius/common/store';
import { ScrollView, View } from 'react-native';
import { useSelector } from 'react-redux';
import { IconShare, Button } from '@audius/harmony-native';
import { ChainLogo, Text } from 'app/components/core';
import { AppDrawer } from 'app/components/drawer';
import { makeStyles } from 'app/styles';
import { getCollectiblesRoute } from 'app/utils/routes';
import share from 'app/utils/share';
import { CollectibleDate } from './CollectibleDate';
import { CollectibleLink } from './CollectibleLink';
import { CollectibleMedia } from './CollectibleMedia';
var getCollectible = collectibleDetailsUISelectors.getCollectible, getCollectibleOwnerId = collectibleDetailsUISelectors.getCollectibleOwnerId;
var getUser = cacheUsersSelectors.getUser;
var MODAL_NAME = 'CollectibleDetails';
export var messages = {
    owned: 'OWNED',
    created: 'CREATED',
    share: 'SHARE',
    linkToCollectible: 'Link To Collectible',
    dateCreated: 'Date Created:',
    lastTransferred: 'Last Transferred:'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        root: {
            padding: spacing(6),
            paddingTop: spacing(2)
        },
        details: {
            marginTop: spacing(6)
        },
        detailsDescription: {
            marginBottom: spacing(6)
        },
        detailsTitle: {
            textAlign: 'center',
            marginBottom: spacing(6)
        },
        detailsStamp: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing(5)
        },
        badge: {
            color: palette.staticWhite,
            textAlign: 'center',
            paddingVertical: spacing(1),
            paddingHorizontal: spacing(2),
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: palette.white
        },
        created: { backgroundColor: palette.primary },
        owned: { backgroundColor: palette.secondary },
        chainLogo: {
            marginLeft: spacing(2)
        },
        shareButton: {
            marginVertical: spacing(4)
        }
    });
});
var getHostname = function (url) {
    // React Native does not have URL builtin so use regex to get hostname
    // Example:
    // https://audius.co/nft -> audius.co
    var _a, _b;
    // Second matched group which will be the hostname
    return (_b = (_a = url.match(/(https*:\/\/)([^/]+)/)) === null || _a === void 0 ? void 0 : _a[2]) !== null && _b !== void 0 ? _b : '';
};
export var CollectibleDetailsDrawer = function () {
    var styles = useStyles();
    var collectible = useSelector(getCollectible);
    var ownerId = useSelector(getCollectibleOwnerId);
    var owner = useSelector(function (state) { return getUser(state, { id: ownerId }); });
    var formattedLink = useMemo(function () {
        var url = collectible === null || collectible === void 0 ? void 0 : collectible.externalLink;
        return url ? getHostname(url) : '';
    }, [collectible]);
    var handleShare = useCallback(function () {
        if (owner && collectible) {
            var url = getCollectiblesRoute(owner.handle, collectible.id);
            share({ url: url });
        }
    }, [owner, collectible]);
    return (<AppDrawer modalName={MODAL_NAME} isGestureSupported={false} isFullscreen>
      {collectible ? (<ScrollView showsVerticalScrollIndicator={false} style={styles.root}>
          <CollectibleMedia collectible={collectible}/>
          <View style={styles.details}>
            <Text style={styles.detailsTitle} variant='h2'>
              {collectible.name}
            </Text>
            <View style={styles.detailsStamp}>
              <Text style={[
                styles.badge,
                collectible.isOwned ? styles.owned : styles.created
            ]} fontSize='xs' weight='bold'>
                {collectible.isOwned ? messages.owned : messages.created}
              </Text>
              <ChainLogo chain={collectible.chain} style={styles.chainLogo}/>
            </View>
            {!!collectible.dateCreated && (<CollectibleDate date={collectible.dateCreated} label={messages.dateCreated}/>)}
            {!!collectible.dateLastTransferred && (<CollectibleDate date={collectible.dateLastTransferred} label={messages.lastTransferred}/>)}
            <Text style={styles.detailsDescription}>
              {collectible.description}
            </Text>
            {!!collectible.externalLink && (<CollectibleLink url={collectible.externalLink} text={formattedLink}/>)}
            {!!collectible.permaLink && (<CollectibleLink url={collectible.permaLink} text={messages.linkToCollectible}/>)}
            <Button style={styles.shareButton} variant='secondary' fullWidth onPress={handleShare} iconLeft={IconShare}>
              {messages.share}
            </Button>
          </View>
        </ScrollView>) : null}
    </AppDrawer>);
};
