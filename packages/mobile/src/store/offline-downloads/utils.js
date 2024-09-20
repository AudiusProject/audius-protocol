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
export var addOfflineTrack = function (offlineTrackMetadata, trackId, metadata) {
    var existingMetadata = offlineTrackMetadata[trackId];
    if (!existingMetadata) {
        offlineTrackMetadata[trackId] = metadata;
        return;
    }
    var downloadReasons = existingMetadata.reasons_for_download;
    var _loop_1 = function (downloadReason) {
        var isDuplicateReason = downloadReasons.some(function (existingReason) {
            return existingReason.collection_id === downloadReason.collection_id &&
                existingReason.is_from_favorites === downloadReason.is_from_favorites;
        });
        if (!isDuplicateReason) {
            downloadReasons.push(downloadReason);
        }
    };
    for (var _i = 0, _a = metadata.reasons_for_download; _i < _a.length; _i++) {
        var downloadReason = _a[_i];
        _loop_1(downloadReason);
    }
    offlineTrackMetadata[trackId] = __assign(__assign(__assign({}, existingMetadata), metadata), { reasons_for_download: downloadReasons });
    return offlineTrackMetadata;
};
export var addOfflineCollection = function (offlineCollectionMetadata, collectionId, metadata) {
    var existingMetadata = offlineCollectionMetadata[collectionId];
    if (!existingMetadata) {
        offlineCollectionMetadata[collectionId] = metadata;
        return;
    }
    var downloadReasons = existingMetadata.reasons_for_download;
    var _loop_2 = function (downloadReason) {
        var isDuplicateReason = downloadReasons.some(function (existingReason) {
            return existingReason.is_from_favorites === downloadReason.is_from_favorites;
        });
        if (!isDuplicateReason) {
            downloadReasons.push(downloadReason);
        }
    };
    for (var _i = 0, _a = metadata.reasons_for_download; _i < _a.length; _i++) {
        var downloadReason = _a[_i];
        _loop_2(downloadReason);
    }
    offlineCollectionMetadata[collectionId] = __assign(__assign(__assign({}, existingMetadata), metadata), { reasons_for_download: downloadReasons });
};
export var removeOfflineTrack = function (offlineTrackMetadata, trackId, metadata) {
    var existingMetadata = offlineTrackMetadata[trackId];
    if (!existingMetadata) {
        return;
    }
    var downloadReasons = existingMetadata.reasons_for_download.filter(function (downloadReason) {
        var shouldDeleteReason = metadata.reasons_for_download.some(function (existingReason) {
            return existingReason.collection_id === downloadReason.collection_id &&
                existingReason.is_from_favorites === downloadReason.is_from_favorites;
        });
        return !shouldDeleteReason;
    });
    if (downloadReasons.length === 0) {
        delete offlineTrackMetadata[trackId];
    }
    else {
        offlineTrackMetadata[trackId] = __assign(__assign(__assign({}, existingMetadata), metadata), { reasons_for_download: downloadReasons });
    }
};
export var removeOfflineCollection = function (offlineCollectionMetadata, collectionId, metadata) {
    var existingMetadata = offlineCollectionMetadata[collectionId];
    if (!existingMetadata) {
        return;
    }
    var downloadReasons = existingMetadata.reasons_for_download.filter(function (downloadReason) {
        var shouldDeleteReason = metadata.reasons_for_download.some(function (existingReason) {
            return existingReason.is_from_favorites === downloadReason.is_from_favorites;
        });
        return !shouldDeleteReason;
    });
    if (downloadReasons.length === 0) {
        delete offlineCollectionMetadata[collectionId];
    }
    else {
        offlineCollectionMetadata[collectionId] = __assign(__assign(__assign({}, existingMetadata), metadata), { reasons_for_download: downloadReasons });
    }
};
