import { useCallback } from 'react';
import { cacheCollectionsActions, cacheCollectionsSelectors, duplicateAddConfirmationModalUISelectors } from '@audius/common/store';
import { fillString } from '@audius/common/utils';
import { capitalize } from 'lodash';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import { useToast } from 'app/hooks/useToast';
import { makeStyles } from 'app/styles';
import { useDrawerState } from '../drawer';
import Drawer from '../drawer/Drawer';
var getPlaylistId = duplicateAddConfirmationModalUISelectors.getPlaylistId, getTrackId = duplicateAddConfirmationModalUISelectors.getTrackId;
var addTrackToPlaylist = cacheCollectionsActions.addTrackToPlaylist;
var getCollection = cacheCollectionsSelectors.getCollection;
var getMessages = function (collectionType) { return ({
    drawerTitle: 'Already Added',
    drawerBody: "This is already in your%0 ".concat(collectionType, "."),
    buttonAddText: 'Add Anyway',
    buttonCancelText: "Don't Add",
    addedToast: "Added To ".concat(capitalize(collectionType), "!")
}); };
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing;
    return ({
        title: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing(2),
            alignItems: 'center',
            paddingVertical: spacing(6),
            borderBottomColor: palette.neutralLight8,
            borderBottomWidth: 1
        },
        titleText: {
            textTransform: 'uppercase'
        },
        container: {
            marginHorizontal: spacing(4)
        },
        body: {
            margin: spacing(4),
            lineHeight: spacing(6),
            textAlign: 'center'
        },
        buttonContainer: {
            gap: spacing(2),
            marginBottom: spacing(8)
        }
    });
});
export var DuplicateAddConfirmationDrawer = function () {
    var playlistId = useSelector(getPlaylistId);
    var trackId = useSelector(getTrackId);
    var playlist = useSelector(function (state) {
        return getCollection(state, { id: playlistId });
    });
    var dispatch = useDispatch();
    var styles = useStyles();
    var toast = useToast().toast;
    var _a = useDrawerState('DuplicateAddConfirmation'), isOpen = _a.isOpen, onClose = _a.onClose;
    var messages = getMessages((playlist === null || playlist === void 0 ? void 0 : playlist.is_album) ? 'album' : 'playlist');
    var handleAdd = useCallback(function () {
        if (playlistId && trackId) {
            toast({ content: messages.addedToast });
            dispatch(addTrackToPlaylist(trackId, playlistId));
        }
        onClose();
    }, [playlistId, trackId, onClose, toast, messages.addedToast, dispatch]);
    return (<Drawer isOpen={isOpen} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.title}>
          <Text weight='heavy' color='neutral' fontSize='xl' style={styles.titleText}>
            {messages.drawerTitle}
          </Text>
        </View>
        <Text style={styles.body} fontSize='large' weight='medium'>
          {fillString(messages.drawerBody, playlist ? " \"".concat(playlist.playlist_name, "\"") : '')}
        </Text>
        <View style={styles.buttonContainer}>
          <Button variant='primary' fullWidth onPress={onClose}>
            {messages.buttonCancelText}
          </Button>
          <Button variant='secondary' fullWidth onPress={handleAdd}>
            {messages.buttonAddText}
          </Button>
        </View>
      </View>
    </Drawer>);
};
