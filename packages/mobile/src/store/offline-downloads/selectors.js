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
import { cacheTracksSelectors } from '@audius/common/store';
import { removeNullable } from '@audius/common/utils';
import { DOWNLOAD_REASON_FAVORITES } from './constants';
import { OfflineDownloadStatus } from './slice';
var getTrack = cacheTracksSelectors.getTrack;
export var getOfflineTrackStatus = function (state) {
    return state.offlineDownloads.trackStatus;
};
export var getTrackOfflineDownloadStatus = function (trackId) { return function (state) { var _a; return trackId ? (_a = state.offlineDownloads.trackStatus[trackId]) !== null && _a !== void 0 ? _a : null : null; }; };
export var getTrackDownloadStatus = function (state, trackId) {
    return state.offlineDownloads.trackStatus[trackId];
};
export var getCollectionOfflineDownloadStatus = function (collectionId) { return function (state) {
    return collectionId ? state.offlineDownloads.collectionStatus[collectionId] : null;
}; };
export var getCollectionDownloadStatus = function (state, collectionId) { return state.offlineDownloads.collectionStatus[collectionId]; };
export var getCollectionSyncStatus = function (state, collectionId) { return state.offlineDownloads.collectionSyncStatus[collectionId]; };
export var getIsFavoritesDownloadsEnabled = function (state) {
    return Boolean(state.offlineDownloads.collectionStatus[DOWNLOAD_REASON_FAVORITES]);
};
// TODO: This should verify that the status is correct
export var getIsCollectionMarkedForDownload = function (collectionId) { return function (state) {
    return !!(collectionId && state.offlineDownloads.collectionStatus[collectionId]);
}; };
export var getTrackOfflineMetadata = function (trackId) { return function (state) {
    return trackId ? state.offlineDownloads.offlineTrackMetadata[trackId] : null;
}; };
export var getTrackDownloadReasons = function (trackId) { return function (state) {
    return trackId
        ? state.offlineDownloads.offlineTrackMetadata[trackId]
            .reasons_for_download
        : [];
}; };
export var getIsDoneLoadingFromDisk = function (state) {
    return state.offlineDownloads.isDoneLoadingFromDisk;
};
export var getOfflineTrackMetadata = function (state) {
    return state.offlineDownloads.offlineTrackMetadata;
};
export var getOfflineCollectionMetadata = function (state) {
    return state.offlineDownloads.offlineCollectionMetadata;
};
export var getOfflineCollectionsStatus = function (state) {
    return state.offlineDownloads.collectionStatus;
};
export var getOfflineQueue = function (state) {
    return state.offlineDownloads.offlineQueue;
};
export var getQueueStatus = function (state) {
    return state.offlineDownloads.queueStatus;
};
// Computed Selectors
// Get ids for successfully downloaded tracks
export var getOfflineTrackIds = function (state) {
    return Object.entries(state.offlineDownloads.trackStatus)
        .filter(function (_a) {
        var id = _a[0], downloadStatus = _a[1];
        return downloadStatus === OfflineDownloadStatus.SUCCESS;
    })
        .map(function (_a) {
        var id = _a[0], downloadstatus = _a[1];
        return id;
    });
};
export var getOfflineTrack = function (trackId) {
    return function (state) {
        if (getTrackOfflineDownloadStatus(trackId)(state) !==
            OfflineDownloadStatus.SUCCESS)
            return null;
        var track = getTrack(state, { id: trackId });
        if (!track)
            return null;
        var offlineMetadata = getTrackOfflineMetadata(trackId)(state);
        return __assign(__assign({}, track), { offline: offlineMetadata || undefined });
    };
};
export var getOfflineTracks = function (state) {
    var offlineTrackIds = getOfflineTrackIds(state);
    return offlineTrackIds
        .map(function (trackIdStr) {
        var trackId = parseInt(trackIdStr);
        var track = getTrack(state, { id: trackId });
        if (!track)
            return null;
        var offlineMetadata = getTrackOfflineMetadata(trackId)(state);
        return __assign(__assign({}, track), { offline: offlineMetadata || undefined });
    })
        .filter(removeNullable);
};
export var getPreferredDownloadNetworkType = function (state) {
    return state.offlineDownloads.preferredDownloadNetworkType;
};
export var getCurrentNetworkType = function (state) {
    return state.offlineDownloads.currentNetworkType;
};
