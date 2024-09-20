var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { createElement, memo, useCallback, useMemo } from 'react';
import { CreatePlaylistSource } from '@audius/common/models';
import { CardList } from 'app/components/core';
import { AddCollectionCard } from './AddCollectionCard';
import { CollectionCard } from './CollectionCard';
import { CollectionCardSkeleton } from './CollectionCardSkeleton';
var MemoizedCollectionCard = memo(CollectionCard);
var FullCollectionList = function (props) {
    var collection = props.collection, _a = props.collectionType, collectionType = _a === void 0 ? 'playlist' : _a, _b = props.showCreateCollectionTile, showCreateCollectionTile = _b === void 0 ? false : _b, _c = props.createPlaylistSource, createPlaylistSource = _c === void 0 ? CreatePlaylistSource.LIBRARY_PAGE : _c, createPlaylistTrackId = props.createPlaylistTrackId, createPlaylistCallback = props.createPlaylistCallback, renderItem = props.renderItem, onCollectionPress = props.onCollectionPress, other = __rest(props, ["collection", "collectionType", "showCreateCollectionTile", "createPlaylistSource", "createPlaylistTrackId", "createPlaylistCallback", "renderItem", "onCollectionPress"]);
    var renderCard = useCallback(function (_a) {
        var item = _a.item;
        return '_create' in item ? (<AddCollectionCard source={createPlaylistSource} sourceTrackId={createPlaylistTrackId} onCreate={createPlaylistCallback} collectionType={collectionType}/>) : (<CollectionCard id={item.playlist_id} onPress={onCollectionPress
                ? function () { return onCollectionPress(item.playlist_id); }
                : undefined}/>);
    }, [
        collectionType,
        createPlaylistCallback,
        createPlaylistSource,
        createPlaylistTrackId,
        onCollectionPress
    ]);
    var updatedCollection = showCreateCollectionTile
        ? __spreadArray([{ _create: true }], (collection !== null && collection !== void 0 ? collection : []), true) : collection;
    return (<CardList data={updatedCollection} renderItem={renderItem !== null && renderItem !== void 0 ? renderItem : renderCard} LoadingCardComponent={CollectionCardSkeleton} {...other}/>);
};
function isIdListProps(props) {
    return props.collectionIds !== undefined;
}
var CollectionIDList = function (props) {
    var collectionIds = props.collectionIds, _a = props.collectionType, collectionType = _a === void 0 ? 'playlist' : _a, _b = props.showCreateCollectionTile, showCreateCollectionTile = _b === void 0 ? false : _b, _c = props.createPlaylistSource, createPlaylistSource = _c === void 0 ? CreatePlaylistSource.LIBRARY_PAGE : _c, createPlaylistTrackId = props.createPlaylistTrackId, createPlaylistCallback = props.createPlaylistCallback, other = __rest(props, ["collectionIds", "collectionType", "showCreateCollectionTile", "createPlaylistSource", "createPlaylistTrackId", "createPlaylistCallback"]);
    var renderCard = useCallback(function (_a) {
        var item = _a.item;
        return '_create' in item ? (<AddCollectionCard source={createPlaylistSource} sourceTrackId={createPlaylistTrackId} onCreate={createPlaylistCallback} collectionType={collectionType}/>) : (<MemoizedCollectionCard id={item.id}/>);
    }, [
        collectionType,
        createPlaylistCallback,
        createPlaylistSource,
        createPlaylistTrackId
    ]);
    var idList = useMemo(function () {
        var collectionIdData = collectionIds.map(function (id) { return ({ id: id }); });
        return showCreateCollectionTile
            ? __spreadArray([{ _create: true }], collectionIdData, true) : collectionIdData;
    }, [collectionIds, showCreateCollectionTile]);
    return (<CardList data={idList} renderItem={renderCard} LoadingCardComponent={CollectionCardSkeleton} {...other}/>);
};
// Helper to switch between legacy version and newer version of CollectionList.
// The latter just takes IDs and allows the child components to fetch their data
export var CollectionList = function (props) {
    return isIdListProps(props)
        ? createElement(CollectionIDList, props)
        : createElement(FullCollectionList, props);
};
