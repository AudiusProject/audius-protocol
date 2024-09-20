import { useCallback } from 'react';
import { DogEarType, SquareSizes, isContentUSDCPurchaseGated } from '@audius/common/models';
import { accountSelectors, cacheCollectionsSelectors } from '@audius/common/store';
import { formatCount, formatReleaseDate } from '@audius/common/utils';
import { useSelector } from 'react-redux';
import { Divider, Flex, IconHeart, IconRepost, Paper, Text } from '@audius/harmony-native';
import { UserLink } from 'app/components/user-link';
import { useNavigation } from 'app/hooks/useNavigation';
import { DogEar, LockedStatusBadge } from '../core';
import { CollectionImageV2 } from '../image/CollectionImageV2';
import { CollectionDownloadStatusIndicator } from '../offline-downloads';
var getCollection = cacheCollectionsSelectors.getCollection;
var getUserId = accountSelectors.getUserId;
var messages = {
    repost: 'Reposts',
    favorites: 'Favorites',
    hidden: 'Hidden',
    releases: function (releaseDate) {
        return "Releases ".concat(formatReleaseDate({ date: releaseDate }));
    }
};
export var CollectionCard = function (props) {
    var id = props.id, onPress = props.onPress, noNavigation = props.noNavigation;
    var collection = useSelector(function (state) { return getCollection(state, { id: id }); });
    var accountId = useSelector(getUserId);
    var navigation = useNavigation();
    var handlePress = useCallback(function (e) {
        onPress === null || onPress === void 0 ? void 0 : onPress(e);
        if (noNavigation)
            return;
        navigation.navigate('Collection', { id: id });
    }, [onPress, noNavigation, navigation, id]);
    if (!collection) {
        console.warn('Collection missing for CollectionCard, preventing render');
        return null;
    }
    var playlist_id = collection.playlist_id, playlist_name = collection.playlist_name, playlist_owner_id = collection.playlist_owner_id, repost_count = collection.repost_count, save_count = collection.save_count, isPrivate = collection.is_private, access = collection.access, stream_conditions = collection.stream_conditions, releaseDate = collection.release_date, isScheduledRelease = collection.is_scheduled_release, offline = collection.offline;
    var isOwner = accountId === playlist_owner_id;
    var isPurchase = isContentUSDCPurchaseGated(stream_conditions);
    var dogEarType = isPurchase && (!access.stream || isOwner) ? DogEarType.USDC_PURCHASE : null;
    return (<Paper border='default' onPress={handlePress}>
      {dogEarType ? <DogEar type={dogEarType}/> : null}
      <Flex p='s' gap='s'>
        <CollectionImageV2 collectionId={playlist_id} size={SquareSizes.SIZE_480_BY_480} style={{ flex: 1 }}/>
        <Text variant='title' textAlign='center' numberOfLines={1}>
          {playlist_name}
        </Text>
        <UserLink userId={playlist_owner_id} textAlign='center'/>
      </Flex>
      <Divider orientation='horizontal'/>
      <Flex direction='row' gap='l' pv='s' justifyContent='center' backgroundColor='surface1' borderBottomLeftRadius='m' borderBottomRightRadius='m'>
        {isPrivate ? (<Text variant='body' size='s' strength='strong' color='subdued' 
        // Ensures footer height is not affected
        style={{ lineHeight: 16 }}>
            {isScheduledRelease && releaseDate
                ? messages.releases(releaseDate)
                : messages.hidden}
          </Text>) : (<>
            <Flex direction='row' gap='xs' alignItems='center'>
              <IconRepost size='s' color='subdued'/>
              <Text variant='label' color='subdued'>
                {formatCount(repost_count)}
              </Text>
            </Flex>
            <Flex direction='row' gap='xs' alignItems='center'>
              <IconHeart size='s' color='subdued'/>
              <Text variant='label' color='subdued'>
                {formatCount(save_count)}
              </Text>
            </Flex>
          </>)}
        {isPurchase && !isOwner ? (<LockedStatusBadge variant='purchase' locked={!access.stream}/>) : null}
        {offline ? (<CollectionDownloadStatusIndicator collectionId={playlist_id} size='s'/>) : null}
      </Flex>
    </Paper>);
};
