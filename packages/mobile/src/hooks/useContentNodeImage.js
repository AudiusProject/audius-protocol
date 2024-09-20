var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '@audius/common/context';
import { interleave } from '@audius/common/utils';
export var isImageUriSource = function (source) {
    return (source === null || source === void 0 ? void 0 : source.uri) !== undefined;
};
/**
 * Create an array of ImageSources for an endpoint and sizes
 */
var createImageSourcesForEndpoints = function (_a) {
    var endpoints = _a.endpoints, createUri = _a.createUri;
    return endpoints.reduce(function (result, endpoint) {
        var source = {
            uri: createUri(endpoint),
            // A CID is a unique identifier of a piece of content,
            // so we can always rely on a cached value
            // https://reactnative.dev/docs/images#cache-control-ios-only
            cache: 'force-cache'
        };
        return __spreadArray(__spreadArray([], result, true), [source], false);
    }, []);
};
/**
 * Create all the sources for an image.
 * Includes legacy endpoints and optionally lokj cal sources
 */
export var createAllImageSources = function (_a) {
    var cid = _a.cid, endpoints = _a.endpoints, size = _a.size, localSource = _a.localSource, _b = _a.cidMap, cidMap = _b === void 0 ? null : _b;
    if (!cid || !endpoints) {
        if (localSource)
            return [localSource];
        return [];
    }
    var cidForSize = null;
    if (cidMap && cidMap[size]) {
        cidForSize = cidMap[size];
    }
    var newImageSources = createImageSourcesForEndpoints({
        endpoints: endpoints,
        createUri: function (endpoint) {
            return cidForSize
                ? "".concat(endpoint, "/content/").concat(cidForSize)
                : "".concat(endpoint, "/content/").concat(cid, "/").concat(size, ".jpg");
        }
    });
    // These can be removed when all the data on Content Node has
    // been migrated to the new path
    var legacyImageSources = createImageSourcesForEndpoints({
        endpoints: endpoints,
        createUri: function (endpoint) { return "".concat(endpoint).concat(cid); }
    });
    var sourceList = __spreadArray(__spreadArray([], (localSource ? [localSource] : []), true), interleave(newImageSources, legacyImageSources), true);
    return sourceList;
};
/**
 * Return the first image source, usually the best content node
 * or a local source. This is useful for cases where there is no error
 * callback if the image fails to load - like the MusicControls on the lockscreen
 */
export var getImageSourceOptimistic = function (options) {
    var allImageSources = createAllImageSources(options);
    return allImageSources[0];
};
/**
 * Load an image from best content node
 *
 * If the image fails to load, try the next best node
 *
 * Returns props for the DynamicImage component
 * @returns {
 *  source: ImageSource
 *  onError: () => void
 *  isFallbackImage: boolean
 * }
 */
export var useContentNodeImage = function (options) {
    var cid = options.cid, size = options.size, fallbackImageSource = options.fallbackImageSource, localSource = options.localSource, cidMap = options.cidMap;
    var _a = useState(0), imageSourceIndex = _a[0], setImageSourceIndex = _a[1];
    var _b = useState(false), failedToLoad = _b[0], setFailedToLoad = _b[1];
    var storageNodeSelector = useAppContext().storageNodeSelector;
    var endpoints = useMemo(function () {
        if (!cid || !storageNodeSelector)
            return [];
        return storageNodeSelector.getNodes(cid);
    }, [cid, storageNodeSelector]);
    // Create an array of ImageSources
    // based on the content node endpoints
    var imageSources = useMemo(function () {
        return createAllImageSources({
            cid: cid,
            endpoints: endpoints,
            localSource: localSource,
            size: size,
            cidMap: cidMap
        });
    }, [cid, endpoints, localSource, size, cidMap]);
    var handleError = useCallback(function () {
        if (imageSourceIndex < imageSources.length - 1) {
            // Image failed to load from the current node
            setImageSourceIndex(imageSourceIndex + 1);
        }
        else {
            // Image failed to load from any node in replica set
            setFailedToLoad(true);
        }
    }, [imageSourceIndex, imageSources]);
    useEffect(function () {
        // Any time a new image loads reset our failure states
        if (failedToLoad) {
            setFailedToLoad(false);
            setImageSourceIndex(0);
        }
    }, [cid, failedToLoad]);
    // when localSource is a number, it's a placeholder image, so we should show fallback image
    var showFallbackImage = (!cid && (!localSource || typeof localSource === 'number')) || failedToLoad;
    var source = useMemo(function () {
        if (showFallbackImage) {
            return fallbackImageSource;
        }
        return imageSources[imageSourceIndex];
    }, [showFallbackImage, imageSources, imageSourceIndex, fallbackImageSource]);
    var result = useMemo(function () { return ({
        source: source,
        handleError: handleError,
        isFallbackImage: showFallbackImage
    }); }, [source, handleError, showFallbackImage]);
    return result;
};
