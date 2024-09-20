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
import { cacheCollectionsSelectors } from '@audius/common/store';
import { capitalize } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useDrawer } from 'app/hooks/useDrawer';
import { requestRemoveDownloadedCollection } from 'app/store/offline-downloads/slice';
import { ConfirmationDrawer } from './ConfirmationDrawer';
var getCollection = cacheCollectionsSelectors.getCollection;
var messages = {
    header: 'Are You Sure?',
    description: function (contentType) {
        return "Are you sure you want to remove this ".concat(contentType, " from your device?");
    },
    confirm: function (contentType) {
        return "Remove Downloaded ".concat(capitalize(contentType));
    }
};
var drawerName = 'RemoveDownloadedCollection';
export var RemoveDownloadedCollectionDrawer = function () {
    var data = useDrawer(drawerName).data;
    var collectionId = data.collectionId;
    var dispatch = useDispatch();
    var isAlbum = useSelector(function (state) { var _a; return !!((_a = getCollection(state, { id: collectionId })) === null || _a === void 0 ? void 0 : _a.is_album); });
    var contentType = isAlbum ? 'album' : 'playlist';
    var handleConfirm = useCallback(function () {
        dispatch(requestRemoveDownloadedCollection({ collectionId: collectionId }));
    }, [dispatch, collectionId]);
    return (<ConfirmationDrawer drawerName={drawerName} messages={__assign(__assign({}, messages), { confirm: messages.confirm(contentType), description: messages.description(contentType) })} onConfirm={handleConfirm}/>);
};
