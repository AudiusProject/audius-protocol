import { useCallback } from 'react';
import { cacheCollectionsActions, cacheCollectionsSelectors, deletePlaylistConfirmationModalUISelectors } from '@audius/common/store';
import { fillString } from '@audius/common/utils';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'app/hooks/useNavigation';
import { useDrawerState } from '../drawer';
import { ConfirmationDrawer } from '../drawers';
var getPlaylistId = deletePlaylistConfirmationModalUISelectors.getPlaylistId;
var deletePlaylist = cacheCollectionsActions.deletePlaylist;
var getCollection = cacheCollectionsSelectors.getCollection;
var messages = {
    header: 'Delete Playlist?',
    description: 'Are you sure you want to delete your playlist, %0?',
    confirm: 'Delete',
    cancel: 'Cancel'
};
var modalName = 'DeletePlaylistConfirmation';
export var DeletePlaylistConfirmationDrawer = function () {
    var playlistId = useSelector(getPlaylistId);
    var playlist = useSelector(function (state) {
        return getCollection(state, { id: playlistId });
    });
    var dispatch = useDispatch();
    var navigation = useNavigation();
    var onClose = useDrawerState(modalName).onClose;
    var handleConfirm = useCallback(function () {
        if (playlistId) {
            dispatch(deletePlaylist(playlistId));
            navigation.goBack();
        }
        onClose();
    }, [dispatch, playlistId, navigation, onClose]);
    if (!playlist)
        return null;
    messages.description = fillString(messages.description, playlist.playlist_name);
    return (<ConfirmationDrawer modalName={modalName} messages={messages} onConfirm={handleConfirm}/>);
};
