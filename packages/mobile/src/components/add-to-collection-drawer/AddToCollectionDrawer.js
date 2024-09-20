import { useCallback, useMemo, useState } from 'react';
import { useFeatureFlag } from '@audius/common/hooks';
import { CreatePlaylistSource } from '@audius/common/models';
import { FeatureFlags } from '@audius/common/services';
import { accountSelectors, cacheCollectionsActions, addToCollectionUISelectors, duplicateAddConfirmationModalUIActions } from '@audius/common/store';
import { fuzzySearch } from '@audius/common/utils';
import { fetchAccountCollections } from 'common/store/saved-collections/actions';
import { capitalize } from 'lodash';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useEffectOnce } from 'react-use';
import { AppDrawer, useDrawerState } from 'app/components/drawer';
import { useToast } from 'app/hooks/useToast';
import { makeStyles } from 'app/styles';
import { CollectionList } from '../collection-list';
import { AddCollectionCard } from '../collection-list/AddCollectionCard';
import { CollectionCard } from '../collection-list/CollectionCard';
import { FilterInput } from '../filter-input';
var addTrackToPlaylist = cacheCollectionsActions.addTrackToPlaylist, createAlbum = cacheCollectionsActions.createAlbum, createPlaylist = cacheCollectionsActions.createPlaylist;
var getTrackId = addToCollectionUISelectors.getTrackId, getTrackTitle = addToCollectionUISelectors.getTrackTitle, getTrackIsUnlisted = addToCollectionUISelectors.getTrackIsUnlisted, getCollectionType = addToCollectionUISelectors.getCollectionType;
var getAccountWithNameSortedPlaylistsAndAlbums = accountSelectors.getAccountWithNameSortedPlaylistsAndAlbums;
var openDuplicateAddConfirmation = duplicateAddConfirmationModalUIActions.requestOpen;
var selectCollectionsToAddTo = function (state) {
    var collectionType = getCollectionType(state);
    var account = getAccountWithNameSortedPlaylistsAndAlbums(state);
    if (!account)
        return [];
    var albums = account.albums, playlists = account.playlists, user_id = account.user_id;
    var collections = collectionType === 'album' ? albums : playlists;
    return collections.filter(function (collection) { return collection.playlist_owner_id === user_id; });
};
var getMessages = function (collectionType) { return ({
    title: "Add To ".concat(capitalize(collectionType)),
    addedToast: "Added To ".concat(capitalize(collectionType), "!"),
    newCollection: "New ".concat(capitalize(collectionType)),
    hiddenAdd: "You cannot add hidden tracks to a public ".concat(collectionType, "."),
    tracks: function (count) { return "".concat(count, " track").concat(count === 1 ? '' : 's'); },
    filterPlaceholder: 'Find one of your playlists'
}); };
var useStyles = makeStyles(function () { return ({
    cardList: {
        paddingBottom: 240
    }
}); });
export var AddToCollectionDrawer = function () {
    var styles = useStyles();
    var toast = useToast().toast;
    var dispatch = useDispatch();
    var onClose = useDrawerState('AddToCollection').onClose;
    var collectionType = useSelector(getCollectionType);
    var isAlbumType = collectionType === 'album';
    var trackId = useSelector(getTrackId);
    var trackTitle = useSelector(getTrackTitle);
    var isTrackUnlisted = useSelector(getTrackIsUnlisted);
    var _a = useState(''), filter = _a[0], setFilter = _a[1];
    var isHiddenPaidScheduledEnabled = useFeatureFlag(FeatureFlags.HIDDEN_PAID_SCHEDULED).isEnabled;
    var messages = getMessages(collectionType);
    useEffectOnce(function () {
        dispatch(fetchAccountCollections());
    });
    var collectionsToAddTo = useSelector(selectCollectionsToAddTo);
    var filteredCollectionsToAddTo = useMemo(function () {
        return filter
            ? fuzzySearch(filter, collectionsToAddTo, 3, function (collection) { return collection.playlist_name; })
            : collectionsToAddTo;
    }, [collectionsToAddTo, filter]);
    var handleAddToNewCollection = useCallback(function () {
        var metadata = {
            playlist_name: trackTitle !== null && trackTitle !== void 0 ? trackTitle : messages.newCollection
        };
        dispatch((isAlbumType ? createAlbum : createPlaylist)(metadata, CreatePlaylistSource.FROM_TRACK, trackId, 'toast'));
        onClose();
    }, [
        dispatch,
        isAlbumType,
        messages.newCollection,
        onClose,
        trackId,
        trackTitle
    ]);
    var renderCard = useCallback(function (_a) {
        var item = _a.item;
        return '_create' in item ? (<AddCollectionCard source={CreatePlaylistSource.FROM_TRACK} sourceTrackId={trackId} onCreate={handleAddToNewCollection} collectionType={collectionType}/>) : (<CollectionCard key={item.playlist_id} id={item.playlist_id} noNavigation onPress={function () {
                if (!trackId)
                    return;
                // Don't add if the track is hidden, but collection is public
                if (!isHiddenPaidScheduledEnabled &&
                    isTrackUnlisted &&
                    !item.is_private) {
                    toast({ content: messages.hiddenAdd });
                    return;
                }
                var doesCollectionContainTrack = item.playlist_contents.track_ids.some(function (track) { return track.track === trackId; });
                if (doesCollectionContainTrack) {
                    dispatch(openDuplicateAddConfirmation({
                        playlistId: item.playlist_id,
                        trackId: trackId
                    }));
                }
                else {
                    toast({ content: messages.addedToast });
                    dispatch(addTrackToPlaylist(trackId, item.playlist_id));
                }
                onClose();
            }}/>);
    }, [
        trackId,
        handleAddToNewCollection,
        collectionType,
        isTrackUnlisted,
        messages,
        isHiddenPaidScheduledEnabled,
        onClose,
        toast,
        dispatch
    ]);
    if (!trackId || !trackTitle) {
        return null;
    }
    return (<AppDrawer modalName='AddToCollection' isFullscreen isGestureSupported={false} title={messages.title}>
      <View>
        <CollectionList ListHeaderComponent={<FilterInput placeholder={messages.filterPlaceholder} onChangeText={setFilter}/>} contentContainerStyle={styles.cardList} collection={filteredCollectionsToAddTo} showCreateCollectionTile renderItem={renderCard}/>
      </View>
    </AppDrawer>);
};
