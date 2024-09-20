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
import { FavoriteSource } from '@audius/common/models';
import { collectionsSocialActions } from '@audius/common/store';
import { useDispatch, useSelector } from 'react-redux';
import { useDrawer } from 'app/hooks/useDrawer';
import { ConfirmationDrawer } from './ConfirmationDrawer';
var messages = {
    header: 'Are You Sure?',
    description: function (isAlbum) {
        return "Unfavoriting this ".concat(isAlbum ? 'album' : 'playlist', " will also remove it from your device");
    },
    confirm: 'Unfavorite and Remove'
};
var drawerName = 'UnfavoriteDownloadedCollection';
var unsaveCollection = collectionsSocialActions.unsaveCollection;
export var UnfavoriteDownloadedCollectionDrawer = function () {
    var data = useDrawer(drawerName).data;
    var dispatch = useDispatch();
    var collectionId = data.collectionId;
    var isAlbum = useSelector(function (state) { var _a; return (_a = state.collections.entries[collectionId]) === null || _a === void 0 ? void 0 : _a.metadata.is_album; });
    var handleConfirm = useCallback(function () {
        dispatch(unsaveCollection(collectionId, FavoriteSource.COLLECTION_PAGE));
    }, [collectionId, dispatch]);
    return (<ConfirmationDrawer drawerName={drawerName} messages={__assign(__assign({}, messages), { description: messages.description(isAlbum) })} onConfirm={handleConfirm}/>);
};
