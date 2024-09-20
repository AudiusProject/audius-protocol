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
var _a;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfoStateType } from '@react-native-community/netinfo';
import { createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { addOfflineCollection, addOfflineTrack, removeOfflineCollection, removeOfflineTrack } from './utils';
export var QueueStatus;
(function (QueueStatus) {
    QueueStatus["IDLE"] = "IDLE";
    QueueStatus["PAUSED"] = "PAUSED";
    QueueStatus["PROCESSING"] = "PROCESSING";
})(QueueStatus || (QueueStatus = {}));
export var OfflineDownloadStatus;
(function (OfflineDownloadStatus) {
    // download is not initiated
    OfflineDownloadStatus["INACTIVE"] = "INACTIVE";
    // download is queued
    OfflineDownloadStatus["INIT"] = "INIT";
    // download is in progress
    OfflineDownloadStatus["LOADING"] = "LOADING";
    // download succeeded
    OfflineDownloadStatus["SUCCESS"] = "SUCCESS";
    // download errored
    OfflineDownloadStatus["ERROR"] = "ERROR";
    // download was abandoned (usually after error).
    // downloads in the error state can be retried
    OfflineDownloadStatus["ABANDONED"] = "ABANDONED";
})(OfflineDownloadStatus || (OfflineDownloadStatus = {}));
export var CollectionSyncStatus;
(function (CollectionSyncStatus) {
    CollectionSyncStatus["INIT"] = "INIT";
    CollectionSyncStatus["SYNCING"] = "SYNCING";
    CollectionSyncStatus["SUCCESS"] = "SUCCESS";
    CollectionSyncStatus["ERROR"] = "ERROR";
})(CollectionSyncStatus || (CollectionSyncStatus = {}));
var initialState = {
    isDoneLoadingFromDisk: false,
    trackStatus: {},
    collectionStatus: {},
    collectionSyncStatus: {},
    offlineQueue: [],
    queueStatus: QueueStatus.IDLE,
    offlineCollectionMetadata: {},
    offlineTrackMetadata: {},
    preferredDownloadNetworkType: NetInfoStateType.cellular,
    currentNetworkType: NetInfoStateType.unknown
};
var slice = createSlice({
    name: 'offlineDownloads',
    initialState: initialState,
    reducers: {
        redownloadOfflineItems: function (state, action) {
            var trackStatus = state.trackStatus, collectionStatus = state.collectionStatus, offlineQueue = state.offlineQueue;
            var items = action.payload.items;
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                var type = item.type, id = item.id;
                if (type === 'collection') {
                    collectionStatus[id] = OfflineDownloadStatus.INIT;
                }
                else if (type === 'track') {
                    trackStatus[id] = OfflineDownloadStatus.INIT;
                }
                offlineQueue.push(item);
            }
        },
        addOfflineEntries: function (state, action) {
            var items = action.payload.items;
            var offlineTrackMetadata = state.offlineTrackMetadata, trackStatus = state.trackStatus, offlineQueue = state.offlineQueue, offlineCollectionMetadata = state.offlineCollectionMetadata, collectionStatus = state.collectionStatus, collectionSyncStatus = state.collectionSyncStatus;
            for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
                var item = items_2[_i];
                if (item.type === 'track') {
                    var type = item.type, id = item.id, metadata = item.metadata;
                    addOfflineTrack(offlineTrackMetadata, id, metadata);
                    if (!trackStatus[id] ||
                        trackStatus[id] === OfflineDownloadStatus.ERROR) {
                        trackStatus[id] = OfflineDownloadStatus.INIT;
                        offlineQueue.push({ type: type, id: id });
                    }
                }
                else if (item.type === 'collection') {
                    var type = item.type, id = item.id, metadata = item.metadata;
                    addOfflineCollection(offlineCollectionMetadata, id, metadata);
                    if (!collectionStatus[id]) {
                        collectionStatus[id] = OfflineDownloadStatus.INIT;
                        offlineQueue.push({ type: type, id: id });
                    }
                }
                else if (item.type === 'collection-sync') {
                    var id = item.id;
                    var syncStatus = collectionSyncStatus[id];
                    if (!(syncStatus === CollectionSyncStatus.INIT ||
                        syncStatus === CollectionSyncStatus.SYNCING)) {
                        collectionSyncStatus[id] = CollectionSyncStatus.INIT;
                        offlineQueue.push({ type: 'collection-sync', id: id });
                    }
                }
                else if (item.type === 'play-count') {
                    offlineQueue.push(item);
                }
                else if (item.type === 'stale-track') {
                    var id = item.id;
                    var trackMetadata = offlineTrackMetadata[id];
                    if (trackMetadata) {
                        trackMetadata.last_verified_time = Date.now();
                    }
                    offlineQueue.push({ type: 'stale-track', id: id });
                }
            }
        },
        removeOfflineItems: function (state, action) {
            var items = action.payload.items;
            var offlineTrackMetadata = state.offlineTrackMetadata, trackStatus = state.trackStatus, offlineQueue = state.offlineQueue, offlineCollectionMetadata = state.offlineCollectionMetadata, collectionStatus = state.collectionStatus, collectionSyncStatus = state.collectionSyncStatus;
            var _loop_1 = function (item) {
                if (item.type === 'track') {
                    var type_1 = item.type, id_1 = item.id, metadata = item.metadata;
                    removeOfflineTrack(offlineTrackMetadata, id_1, metadata);
                    if (!offlineTrackMetadata[id_1]) {
                        delete trackStatus[id_1];
                        var trackIndex = offlineQueue.findIndex(function (queueItem) { return queueItem.type === type_1 && queueItem.id === id_1; });
                        if (trackIndex !== -1)
                            offlineQueue.splice(trackIndex, 1);
                        var staleTrackIndex = offlineQueue.findIndex(function (queueItem) {
                            return queueItem.type === 'stale-track' && queueItem.id === id_1;
                        });
                        if (staleTrackIndex !== -1)
                            offlineQueue.splice(staleTrackIndex, 1);
                    }
                }
                else if (item.type === 'collection') {
                    var id_2 = item.id, metadata = item.metadata;
                    removeOfflineCollection(offlineCollectionMetadata, id_2, metadata);
                    if (!offlineCollectionMetadata[id_2]) {
                        delete collectionStatus[id_2];
                        delete collectionSyncStatus[id_2];
                        var collectionIndex = offlineQueue.findIndex(function (queueItem) {
                            return queueItem.type === 'collection' && queueItem.id === id_2;
                        });
                        if (collectionIndex !== -1)
                            offlineQueue.splice(collectionIndex, 1);
                        var collectionSyncIndex = offlineQueue.findIndex(function (queueItem) {
                            return queueItem.type === 'collection-sync' && queueItem.id === id_2;
                        });
                        if (collectionSyncIndex !== -1)
                            offlineQueue.splice(collectionSyncIndex, 1);
                    }
                }
            };
            for (var _i = 0, items_3 = items; _i < items_3.length; _i++) {
                var item = items_3[_i];
                _loop_1(item);
            }
        },
        startJob: function (state, action) {
            var _a = action.payload, type = _a.type, id = _a.id;
            if (type === 'collection') {
                state.collectionStatus[id] = OfflineDownloadStatus.LOADING;
            }
            else if (type === 'track') {
                state.trackStatus[id] = OfflineDownloadStatus.LOADING;
            }
            else if (type === 'stale-track') {
                // continue
            }
        },
        completeJob: function (state, action) {
            var _a = action.payload, type = _a.type, id = _a.id;
            if (type === 'collection') {
                state.collectionStatus[id] = OfflineDownloadStatus.SUCCESS;
            }
            else if (type === 'track') {
                var completedAt = action.payload.completedAt;
                state.trackStatus[id] = OfflineDownloadStatus.SUCCESS;
                var trackMetadata = state.offlineTrackMetadata[id];
                if (trackMetadata) {
                    trackMetadata.last_verified_time = completedAt;
                    trackMetadata.download_completed_time = completedAt;
                }
            }
            else if (type === 'stale-track') {
                var verifiedAt = action.payload.verifiedAt;
                var trackMetadata = state.offlineTrackMetadata[id];
                if (trackMetadata) {
                    trackMetadata.last_verified_time = verifiedAt;
                }
            }
            state.offlineQueue.shift();
        },
        cancelJob: function (state, action) {
            var _a = action.payload, type = _a.type, id = _a.id;
            if (type === 'collection') {
                state.collectionStatus[id] = OfflineDownloadStatus.INIT;
            }
            else if (type === 'track') {
                state.trackStatus[id] = OfflineDownloadStatus.INIT;
            }
        },
        errorJob: function (state, action) {
            var _a;
            var _b = action.payload, type = _b.type, id = _b.id;
            if (type === 'collection') {
                state.collectionStatus[id] = OfflineDownloadStatus.ERROR;
            }
            else if (type === 'track') {
                state.trackStatus[id] = OfflineDownloadStatus.ERROR;
                // re-queue the track
                state.offlineQueue.push(__assign(__assign({}, action.payload), { requeueCount: ((_a = action.payload.requeueCount) !== null && _a !== void 0 ? _a : 0) + 1 }));
            }
            else if (type === 'stale-track') {
                // continue
            }
            state.offlineQueue.shift();
        },
        abandonJob: function (state, action) {
            var _a = action.payload, type = _a.type, id = _a.id;
            if (type === 'collection') {
                state.collectionStatus[id] = OfflineDownloadStatus.ABANDONED;
            }
            else if (type === 'track') {
                state.trackStatus[id] = OfflineDownloadStatus.ABANDONED;
            }
            else if (type === 'stale-track') {
                state.trackStatus[id] = OfflineDownloadStatus.ABANDONED;
            }
            state.offlineQueue.shift();
        },
        startCollectionSync: function (state, action) {
            var id = action.payload.id;
            state.collectionSyncStatus[id] = CollectionSyncStatus.SYNCING;
        },
        completeCollectionSync: function (state, action) {
            var id = action.payload.id;
            state.collectionSyncStatus[id] = CollectionSyncStatus.SUCCESS;
            state.offlineQueue.shift();
        },
        cancelCollectionSync: function (state, action) {
            var id = action.payload.id;
            state.collectionSyncStatus[id] = CollectionSyncStatus.INIT;
        },
        errorCollectionSync: function (state, action) {
            var id = action.payload.id;
            state.collectionSyncStatus[id] = CollectionSyncStatus.ERROR;
            state.offlineQueue.shift();
        },
        completePlayCount: function (state) {
            state.offlineQueue.shift();
        },
        updateQueueStatus: function (state, action) {
            state.queueStatus = action.payload.queueStatus;
        },
        doneLoadingFromDisk: function (state) {
            state.isDoneLoadingFromDisk = true;
        },
        clearOfflineDownloads: function (state) {
            state.trackStatus = initialState.trackStatus;
            state.collectionStatus = initialState.collectionStatus;
            state.collectionSyncStatus = initialState.collectionSyncStatus;
            state.offlineTrackMetadata = initialState.offlineTrackMetadata;
            state.trackStatus = initialState.trackStatus;
            state.isDoneLoadingFromDisk = initialState.isDoneLoadingFromDisk;
            state.offlineQueue = initialState.offlineQueue;
            state.queueStatus = initialState.queueStatus;
            state.offlineTrackMetadata = initialState.offlineTrackMetadata;
            state.offlineCollectionMetadata = initialState.offlineCollectionMetadata;
        },
        // Network settings + changes
        setCurrentNetworkType: function (state, action) {
            var currentNetworkType = action.payload.currentNetworkType;
            state.currentNetworkType = currentNetworkType;
        },
        setDownloadNetworkPreference: function (state, action) {
            var downloadNetworkPreference = action.payload.downloadNetworkPreference;
            state.preferredDownloadNetworkType = downloadNetworkPreference;
        },
        // Lifecycle actions that trigger complex saga flows
        requestDownloadAllFavorites: function () { },
        requestRemoveAllDownloadedFavorites: function () { },
        requestDownloadCollection: function (_state, _action) { },
        requestDownloadFavoritedCollection: function (_state, _action) { },
        requestRemoveDownloadedCollection: function (_state, _action) { },
        requestProcessNextJob: function () { }
    }
});
export var addOfflineEntries = (_a = slice.actions, _a.addOfflineEntries), removeOfflineItems = _a.removeOfflineItems, redownloadOfflineItems = _a.redownloadOfflineItems, doneLoadingFromDisk = _a.doneLoadingFromDisk, clearOfflineDownloads = _a.clearOfflineDownloads, startJob = _a.startJob, completeJob = _a.completeJob, cancelJob = _a.cancelJob, errorJob = _a.errorJob, abandonJob = _a.abandonJob, startCollectionSync = _a.startCollectionSync, completeCollectionSync = _a.completeCollectionSync, cancelCollectionSync = _a.cancelCollectionSync, errorCollectionSync = _a.errorCollectionSync, completePlayCount = _a.completePlayCount, updateQueueStatus = _a.updateQueueStatus, setCurrentNetworkType = _a.setCurrentNetworkType, setDownloadNetworkPreference = _a.setDownloadNetworkPreference, requestDownloadAllFavorites = _a.requestDownloadAllFavorites, requestDownloadCollection = _a.requestDownloadCollection, requestDownloadFavoritedCollection = _a.requestDownloadFavoritedCollection, requestRemoveAllDownloadedFavorites = _a.requestRemoveAllDownloadedFavorites, requestRemoveDownloadedCollection = _a.requestRemoveDownloadedCollection, requestProcessNextJob = _a.requestProcessNextJob;
export var actions = slice.actions;
var offlineDownloadsPersistConfig = {
    key: 'offline-downloads',
    storage: AsyncStorage,
    blacklist: ['isDoneLoadingFromDisk', 'queueStatus', 'currentNetworkStateType']
};
var persistedOfflineDownloadsReducer = persistReducer(offlineDownloadsPersistConfig, slice.reducer);
export default persistedOfflineDownloadsReducer;
