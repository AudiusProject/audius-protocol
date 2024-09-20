import { useCallback, useState } from 'react';
import { CreatePlaylistSource } from '@audius/common/models';
import { cacheCollectionsActions } from '@audius/common/store';
import { capitalize } from 'lodash';
import { useDispatch } from 'react-redux';
import { IconSave, Paper, Text } from '@audius/harmony-native';
var createPlaylist = cacheCollectionsActions.createPlaylist, createAlbum = cacheCollectionsActions.createAlbum;
var messages = {
    createPlaylist: function (collectionType) {
        return "Create \n ".concat(capitalize(collectionType));
    }
};
export var AddCollectionCard = function (_a) {
    var onCreate = _a.onCreate, _b = _a.source, source = _b === void 0 ? CreatePlaylistSource.LIBRARY_PAGE : _b, _c = _a.sourceTrackId, sourceTrackId = _c === void 0 ? null : _c, collectionType = _a.collectionType;
    var dispatch = useDispatch();
    var handlePress = useCallback(function () {
        if (onCreate)
            return onCreate();
        dispatch((collectionType === 'album' ? createAlbum : createPlaylist)({
            playlist_name: collectionType === 'album' ? 'New Album' : 'New Playlist'
        }, source, sourceTrackId, source === CreatePlaylistSource.FROM_TRACK ? 'toast' : 'route'));
    }, [onCreate, dispatch, collectionType, source, sourceTrackId]);
    var _d = useState(undefined), height = _d[0], setHeight = _d[1];
    return (<Paper alignItems='center' justifyContent='center' gap='xs' onPress={handlePress} h={height} onLayout={function (e) {
            // Dynamically size this card based on the width of it's container
            // to match collection card image.
            // 98 is the height of the rest of the collection card, which is static
            setHeight(e.nativeEvent.layout.width + 98);
        }} style={{ minHeight: 250 }}>
      <IconSave color='default' size='m'/>
      <Text numberOfLines={2} variant='title' textAlign='center'>
        {messages.createPlaylist(collectionType)}
      </Text>
    </Paper>);
};
