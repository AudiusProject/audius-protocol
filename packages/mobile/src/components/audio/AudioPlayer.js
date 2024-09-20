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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
import { useRef, useEffect, useCallback, useState } from 'react';
import { useAppContext } from '@audius/common/context';
import { Name, SquareSizes } from '@audius/common/models';
import { FeatureFlags } from '@audius/common/services';
import { accountSelectors, cacheTracksSelectors, cacheUsersSelectors, savedPageTracksLineupActions, queueActions, queueSelectors, RepeatMode, reachabilitySelectors, tracksSocialActions, playerActions, playerSelectors, playbackRateValueMap, playbackPositionActions, playbackPositionSelectors, gatedContentSelectors, calculatePlayerBehavior, PlayerBehavior, cacheTracksActions } from '@audius/common/store';
import { Genre, encodeHashId, shallowCompare, removeNullable, getQueryParams, getTrackPreviewDuration } from '@audius/common/utils';
import { isEqual } from 'lodash';
import TrackPlayer, { AppKilledPlaybackBehavior, Capability, Event, State, useTrackPlayerEvents, RepeatMode as TrackPlayerRepeatMode, TrackType, useIsPlaying } from 'react-native-track-player';
import { useDispatch, useSelector } from 'react-redux';
import { useAsync, usePrevious } from 'react-use';
import { DEFAULT_IMAGE_URL } from 'app/components/image/TrackImage';
import { getImageSourceOptimistic } from 'app/hooks/useContentNodeImage';
import { useFeatureFlag } from 'app/hooks/useRemoteConfig';
import { make, track as analyticsTrack } from 'app/services/analytics';
import { apiClient } from 'app/services/audius-api-client';
import { audiusBackendInstance } from 'app/services/audius-backend-instance';
import { getLocalAudioPath, getLocalTrackCoverArtPath } from 'app/services/offline-downloader';
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants';
import { getOfflineTrackStatus, getIsCollectionMarkedForDownload } from 'app/store/offline-downloads/selectors';
import { addOfflineEntries, OfflineDownloadStatus } from 'app/store/offline-downloads/slice';
import { useChromecast } from './GoogleCast';
import { useSavePodcastProgress } from './useSavePodcastProgress';
var getUserId = accountSelectors.getUserId;
var getUsers = cacheUsersSelectors.getUsers;
var getTracks = cacheTracksSelectors.getTracks, getTrackStreamUrls = cacheTracksSelectors.getTrackStreamUrls;
var setStreamUrls = cacheTracksActions.setStreamUrls;
var getPlaying = playerSelectors.getPlaying, getSeek = playerSelectors.getSeek, getCurrentTrack = playerSelectors.getCurrentTrack, getCounter = playerSelectors.getCounter, getPlaybackRate = playerSelectors.getPlaybackRate, getUid = playerSelectors.getUid;
var setTrackPosition = playbackPositionActions.setTrackPosition;
var getUserTrackPositions = playbackPositionSelectors.getUserTrackPositions;
var recordListen = tracksSocialActions.recordListen;
var getPlayerBehavior = queueSelectors.getPlayerBehavior;
var getIndex = queueSelectors.getIndex, getOrder = queueSelectors.getOrder, getSource = queueSelectors.getSource, getCollectionId = queueSelectors.getCollectionId, getRepeat = queueSelectors.getRepeat, getShuffle = queueSelectors.getShuffle;
var getIsReachable = reachabilitySelectors.getIsReachable;
var getNftAccessSignatureMap = gatedContentSelectors.getNftAccessSignatureMap;
// TODO: These constants are the same in now playing drawer. Move them to shared location
var SKIP_DURATION_SEC = 15;
var RESTART_THRESHOLD_SEC = 3;
var RECORD_LISTEN_SECONDS = 1;
var TRACK_END_BUFFER = 2;
var defaultCapabilities = [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious
];
var longFormContentCapabilities = __spreadArray(__spreadArray([], defaultCapabilities, true), [
    Capability.JumpForward,
    Capability.JumpBackward
], false);
// Set options for controlling music on the lock screen when the app is in the background
var updatePlayerOptions = function (isLongFormContent) {
    if (isLongFormContent === void 0) { isLongFormContent = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var coreCapabilities;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    coreCapabilities = isLongFormContent
                        ? longFormContentCapabilities
                        : defaultCapabilities;
                    return [4 /*yield*/, TrackPlayer.updateOptions({
                            // Media controls capabilities
                            capabilities: __spreadArray(__spreadArray([], coreCapabilities, true), [Capability.Stop, Capability.SeekTo], false),
                            // Capabilities that will show up when the notification is in the compact form on Android
                            compactCapabilities: coreCapabilities,
                            // Notification form capabilities
                            notificationCapabilities: coreCapabilities,
                            android: {
                                appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
};
var playerEvents = [
    Event.PlaybackError,
    Event.PlaybackProgressUpdated,
    Event.PlaybackQueueEnded,
    Event.PlaybackActiveTrackChanged,
    Event.RemotePlay,
    Event.RemotePause,
    Event.RemoteNext,
    Event.RemotePrevious,
    Event.RemoteJumpForward,
    Event.RemoteJumpBackward,
    Event.RemoteSeek
];
var unlistedTrackFallbackTrackData = {
    url: 'url',
    type: TrackType.Default,
    title: '',
    artist: '',
    genre: '',
    artwork: '',
    imageUrl: '',
    duration: 0
};
export var AudioPlayer = function () {
    var _a;
    var isNewPodcastControlsEnabled = useFeatureFlag(FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED, FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK).isEnabled;
    var isStreamPrefetchEnabled = useFeatureFlag(FeatureFlags.PREFETCH_STREAM_URLS).isEnabled;
    var track = useSelector(getCurrentTrack);
    var playing = useSelector(getPlaying);
    var seek = useSelector(getSeek);
    var counter = useSelector(getCounter);
    var repeatMode = useSelector(getRepeat);
    var playbackRate = useSelector(getPlaybackRate);
    var currentUserId = useSelector(getUserId);
    var uid = useSelector(getUid);
    var playerBehavior = useSelector(getPlayerBehavior);
    var previousUid = usePrevious(uid);
    var previousPlayerBehavior = usePrevious(playerBehavior) || PlayerBehavior.FULL_OR_PREVIEW;
    var trackPositions = useSelector(function (state) {
        return getUserTrackPositions(state, { userId: currentUserId });
    });
    var isReachable = useSelector(getIsReachable);
    var isNotReachable = isReachable === false;
    var nftAccessSignatureMap = useSelector(getNftAccessSignatureMap);
    var storageNodeSelector = useAppContext().storageNodeSelector;
    useChromecast();
    // Queue Things
    var queueIndex = useSelector(getIndex);
    var queueShuffle = useSelector(getShuffle);
    var queueOrder = useSelector(getOrder);
    var queueSource = useSelector(getSource);
    var queueCollectionId = useSelector(getCollectionId);
    var queueTrackUids = queueOrder.map(function (trackData) { return trackData.uid; });
    var queueTrackIds = queueOrder.map(function (trackData) { return trackData.id; });
    var queueTrackMap = useSelector(function (state) { return getTracks(state, { uids: queueTrackUids }); }, shallowCompare);
    var queueTracks = queueOrder.map(function (_a) {
        var id = _a.id, playerBehavior = _a.playerBehavior;
        return ({
            track: queueTrackMap[id],
            playerBehavior: playerBehavior
        });
    });
    var queueTrackOwnerIds = queueTracks
        .map(function (_a) {
        var track = _a.track;
        return track === null || track === void 0 ? void 0 : track.owner_id;
    })
        .filter(removeNullable);
    var queueTrackOwnersMap = useSelector(function (state) { return getUsers(state, { ids: queueTrackOwnerIds }); }, shallowCompare);
    var isCollectionMarkedForDownload = useSelector(getIsCollectionMarkedForDownload(queueSource === savedPageTracksLineupActions.prefix
        ? DOWNLOAD_REASON_FAVORITES
        : queueCollectionId === null || queueCollectionId === void 0 ? void 0 : queueCollectionId.toString()));
    var wasCollectionMarkedForDownload = usePrevious(isCollectionMarkedForDownload);
    var didOfflineToggleChange = isCollectionMarkedForDownload !== wasCollectionMarkedForDownload;
    var didPlayerBehaviorChange = previousPlayerBehavior !== playerBehavior;
    // A map from trackId to offline availability
    var offlineAvailabilityByTrackId = useSelector(function (state) {
        var offlineTrackStatus = getOfflineTrackStatus(state);
        return queueTrackIds.reduce(function (result, id) {
            var _a;
            if (offlineTrackStatus[id] === OfflineDownloadStatus.SUCCESS) {
                return __assign(__assign({}, result), (_a = {}, _a[id] = true, _a));
            }
            return result;
        }, {});
    }, isEqual);
    var dispatch = useDispatch();
    var isLongFormContentRef = useRef(false);
    var _b = useState(false), isAudioSetup = _b[0], setIsAudioSetup = _b[1];
    var play = useCallback(function () { return dispatch(playerActions.play()); }, [dispatch]);
    var pause = useCallback(function () { return dispatch(playerActions.pause()); }, [dispatch]);
    var next = useCallback(function () { return dispatch(queueActions.next()); }, [dispatch]);
    var previous = useCallback(function () { return dispatch(queueActions.previous()); }, [dispatch]);
    var trackStreamUrls = useSelector(getTrackStreamUrls);
    var isUsingPrefetchUrl = trackStreamUrls[(_a = track === null || track === void 0 ? void 0 : track.track_id) !== null && _a !== void 0 ? _a : -1] !== undefined &&
        isStreamPrefetchEnabled;
    var reset = useCallback(function () { return dispatch(playerActions.reset({ shouldAutoplay: false })); }, [dispatch]);
    var updateQueueIndex = useCallback(function (index) { return dispatch(queueActions.updateIndex({ index: index })); }, [dispatch]);
    var updatePlayerInfo = useCallback(function (_a) {
        var previewing = _a.previewing, trackId = _a.trackId, uid = _a.uid;
        dispatch(playerActions.set({ previewing: previewing, trackId: trackId, uid: uid }));
    }, [dispatch]);
    var _c = useState(), bufferStartTime = _c[0], setBufferStartTime = _c[1];
    var bufferingDuringPlay = useIsPlaying().bufferingDuringPlay; // react-native-track-player hook
    var previousBufferingState = usePrevious(bufferingDuringPlay);
    useEffect(function () {
        // Keep redux buffering status in sync with react-native-track-player's buffering status
        // Only need to dispatch when the value actually changes so we check against the previous value
        if (bufferingDuringPlay !== undefined &&
            bufferingDuringPlay !== previousBufferingState) {
            dispatch(playerActions.setBuffering({ buffering: bufferingDuringPlay }));
            if (!bufferingDuringPlay && bufferStartTime) {
                var bufferDuration = Math.ceil(performance.now() - bufferStartTime);
                analyticsTrack(make({ eventName: Name.BUFFERING_TIME, duration: bufferDuration }));
                setBufferStartTime(undefined);
            }
        }
    }, [
        bufferStartTime,
        bufferingDuringPlay,
        dispatch,
        previousBufferingState,
        track
    ]);
    var makeTrackData = useCallback(function (_a, noPrefetch // option to opt out of prefetched stream urls (see error handling method)
    ) {
        var track = _a.track, playerBehavior = _a.playerBehavior;
        return __awaiter(void 0, void 0, void 0, function () {
            var trackOwner, trackId, offlineTrackAvailable, shouldPreview, url, prefetchedStreamUrl, audioFilePath, queryParams, nftAccessSignature, localTrackImageSource, cid, imageUrl;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!track) {
                            return [2 /*return*/, unlistedTrackFallbackTrackData];
                        }
                        trackOwner = queueTrackOwnersMap[track.owner_id];
                        trackId = track.track_id;
                        offlineTrackAvailable = trackId && offlineAvailabilityByTrackId[trackId];
                        shouldPreview = calculatePlayerBehavior(track, playerBehavior).shouldPreview;
                        prefetchedStreamUrl = trackStreamUrls[trackId];
                        if (!(offlineTrackAvailable && isCollectionMarkedForDownload)) return [3 /*break*/, 1];
                        audioFilePath = getLocalAudioPath(trackId);
                        url = "file://".concat(audioFilePath);
                        return [3 /*break*/, 5];
                    case 1:
                        if (!(prefetchedStreamUrl &&
                            isStreamPrefetchEnabled &&
                            !noPrefetch)) return [3 /*break*/, 2];
                        url = prefetchedStreamUrl;
                        return [3 /*break*/, 5];
                    case 2:
                        queryParams = trackQueryParams.current[trackId];
                        if (!!queryParams) return [3 /*break*/, 4];
                        nftAccessSignature = (_c = (_b = nftAccessSignatureMap[trackId]) === null || _b === void 0 ? void 0 : _b.mp3) !== null && _c !== void 0 ? _c : null;
                        return [4 /*yield*/, getQueryParams({
                                audiusBackendInstance: audiusBackendInstance,
                                nftAccessSignature: nftAccessSignature,
                                userId: currentUserId
                            })];
                    case 3:
                        queryParams = _f.sent();
                        trackQueryParams.current[trackId] = queryParams;
                        _f.label = 4;
                    case 4:
                        queryParams = __assign(__assign({}, queryParams), { preview: shouldPreview });
                        url = apiClient.makeUrl("/tracks/".concat(encodeHashId(track.track_id), "/stream"), queryParams);
                        _f.label = 5;
                    case 5:
                        localTrackImageSource = isNotReachable && track
                            ? { uri: "file://".concat(getLocalTrackCoverArtPath(trackId.toString())) }
                            : undefined;
                        cid = track ? track.cover_art_sizes || track.cover_art : null;
                        imageUrl = cid && storageNodeSelector
                            ? (_e = (_d = getImageSourceOptimistic({
                                cid: cid,
                                endpoints: storageNodeSelector.getNodes(cid),
                                size: SquareSizes.SIZE_1000_BY_1000,
                                localSource: localTrackImageSource
                            })) === null || _d === void 0 ? void 0 : _d.uri) !== null && _e !== void 0 ? _e : DEFAULT_IMAGE_URL
                            : DEFAULT_IMAGE_URL;
                        return [2 /*return*/, {
                                url: url,
                                type: TrackType.Default,
                                title: track.title,
                                artist: trackOwner.name,
                                genre: track.genre,
                                date: track.created_at,
                                artwork: imageUrl,
                                duration: shouldPreview
                                    ? getTrackPreviewDuration(track)
                                    : track.duration
                            }];
                }
            });
        });
    }, [
        currentUserId,
        isCollectionMarkedForDownload,
        isNotReachable,
        isStreamPrefetchEnabled,
        nftAccessSignatureMap,
        offlineAvailabilityByTrackId,
        queueTrackOwnersMap,
        storageNodeSelector,
        trackStreamUrls
    ]);
    // Perform initial setup for the track player
    useAsync(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, updatePlayerOptions()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    return [3 /*break*/, 3];
                case 3:
                    setIsAudioSetup(true);
                    return [2 /*return*/];
            }
        });
    }); }, []);
    // When component unmounts (App is closed), reset
    useEffect(function () {
        return function () {
            reset();
            TrackPlayer.stop();
        };
    }, [reset]);
    useTrackPlayerEvents(playerEvents, function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var duration, position, updatedTrack, playerIndex, _a, track_1, playerBehavior_1, _b, shouldSkip, shouldPreview, isLongFormContent_1, trackPosition, isLongFormContent, newRate, track_2, isLongFormContent_2, isAtEndOfTrack;
        var _c;
        var _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, TrackPlayer.getProgress()];
                case 1:
                    duration = (_k.sent()).duration;
                    return [4 /*yield*/, TrackPlayer.getProgress()];
                case 2:
                    position = (_k.sent()).position;
                    if (!(event.type === Event.PlaybackError)) return [3 /*break*/, 4];
                    console.error("TrackPlayer Playback Error:", event);
                    if (!(isUsingPrefetchUrl && track)) return [3 /*break*/, 4];
                    // Unset the broken stream url, we don't want to accidentally use it again
                    dispatch(setStreamUrls((_c = {}, _c[track.track_id] = undefined, _c)));
                    return [4 /*yield*/, makeTrackData({
                            track: track,
                            playerBehavior: playerBehavior
                        }, true)];
                case 3:
                    updatedTrack = _k.sent();
                    TrackPlayer.load(updatedTrack);
                    _k.label = 4;
                case 4:
                    if (event.type === Event.RemotePlay || event.type === Event.RemotePause) {
                        playing ? pause() : play();
                    }
                    if (event.type === Event.RemoteNext)
                        next();
                    if (event.type === Event.RemotePrevious) {
                        if (position > RESTART_THRESHOLD_SEC) {
                            setSeekPosition(0);
                        }
                        else {
                            previous();
                        }
                    }
                    if (event.type === Event.RemoteSeek) {
                        setSeekPosition(event.position);
                    }
                    if (event.type === Event.RemoteJumpForward) {
                        setSeekPosition(Math.min(duration, position + SKIP_DURATION_SEC));
                    }
                    if (event.type === Event.RemoteJumpBackward) {
                        setSeekPosition(Math.max(0, position - SKIP_DURATION_SEC));
                    }
                    if (event.type === Event.PlaybackQueueEnded) {
                        // TODO: Queue ended, what should done here?
                    }
                    if (!(event.type === Event.PlaybackActiveTrackChanged)) return [3 /*break*/, 10];
                    setBufferStartTime(performance.now());
                    return [4 /*yield*/, enqueueTracksJobRef.current];
                case 5:
                    _k.sent();
                    return [4 /*yield*/, TrackPlayer.getActiveTrackIndex()];
                case 6:
                    playerIndex = _k.sent();
                    if (playerIndex === undefined)
                        return [2 /*return*/];
                    // Update queue and player state if the track player auto plays next track
                    if (playerIndex > queueIndex) {
                        if (queueShuffle) {
                            // TODO: There will be a very short period where the next track in the queue is played instead of the next shuffle track.
                            // Figure out how to call next earlier
                            next();
                        }
                        else {
                            _a = (_d = queueTracks[playerIndex]) !== null && _d !== void 0 ? _d : {}, track_1 = _a.track, playerBehavior_1 = _a.playerBehavior;
                            _b = calculatePlayerBehavior(track_1, playerBehavior_1), shouldSkip = _b.shouldSkip, shouldPreview = _b.shouldPreview;
                            // Skip track if user does not have access i.e. for an unlocked gated track
                            if (!track_1 || shouldSkip) {
                                next();
                            }
                            else {
                                // Track Player natively went to the next track
                                // Update queue info and handle playback position updates
                                updateQueueIndex(playerIndex);
                                updatePlayerInfo({
                                    previewing: shouldPreview,
                                    trackId: track_1.track_id,
                                    uid: queueTrackUids[playerIndex]
                                });
                                isLongFormContent_1 = (track_1 === null || track_1 === void 0 ? void 0 : track_1.genre) === Genre.PODCASTS ||
                                    (track_1 === null || track_1 === void 0 ? void 0 : track_1.genre) === Genre.AUDIOBOOKS;
                                trackPosition = trackPositions === null || trackPositions === void 0 ? void 0 : trackPositions[track_1.track_id];
                                if ((trackPosition === null || trackPosition === void 0 ? void 0 : trackPosition.status) === 'IN_PROGRESS') {
                                    dispatch(playerActions.seek({ seconds: trackPosition.playbackPosition }));
                                }
                                else if (isNewPodcastControlsEnabled && isLongFormContent_1) {
                                    dispatch(setTrackPosition({
                                        userId: currentUserId,
                                        trackId: track_1.track_id,
                                        positionInfo: {
                                            status: 'IN_PROGRESS',
                                            playbackPosition: 0
                                        }
                                    }));
                                }
                            }
                        }
                    }
                    isLongFormContent = ((_f = (_e = queueTracks[playerIndex]) === null || _e === void 0 ? void 0 : _e.track) === null || _f === void 0 ? void 0 : _f.genre) === Genre.PODCASTS ||
                        ((_h = (_g = queueTracks[playerIndex]) === null || _g === void 0 ? void 0 : _g.track) === null || _h === void 0 ? void 0 : _h.genre) === Genre.AUDIOBOOKS;
                    if (!(isLongFormContent !== isLongFormContentRef.current)) return [3 /*break*/, 9];
                    isLongFormContentRef.current = isLongFormContent;
                    newRate = isLongFormContent
                        ? playbackRateValueMap[playbackRate]
                        : 1.0;
                    return [4 /*yield*/, TrackPlayer.setRate(newRate)
                        // Update lock screen and notification controls
                    ];
                case 7:
                    _k.sent();
                    // Update lock screen and notification controls
                    return [4 /*yield*/, updatePlayerOptions(isLongFormContent)];
                case 8:
                    // Update lock screen and notification controls
                    _k.sent();
                    _k.label = 9;
                case 9:
                    // Handle track end event
                    if (isNewPodcastControlsEnabled &&
                        (event === null || event === void 0 ? void 0 : event.lastPosition) !== undefined &&
                        (event === null || event === void 0 ? void 0 : event.index) !== undefined) {
                        track_2 = ((_j = queueTracks[event.index]) !== null && _j !== void 0 ? _j : {}).track;
                        isLongFormContent_2 = (track_2 === null || track_2 === void 0 ? void 0 : track_2.genre) === Genre.PODCASTS || (track_2 === null || track_2 === void 0 ? void 0 : track_2.genre) === Genre.AUDIOBOOKS;
                        isAtEndOfTrack = (track_2 === null || track_2 === void 0 ? void 0 : track_2.duration) &&
                            event.lastPosition >= track_2.duration - TRACK_END_BUFFER;
                        if (isLongFormContent_2 && isAtEndOfTrack) {
                            dispatch(setTrackPosition({
                                userId: currentUserId,
                                trackId: track_2.track_id,
                                positionInfo: {
                                    status: 'COMPLETED',
                                    playbackPosition: 0
                                }
                            }));
                        }
                    }
                    _k.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    }); });
    // Record play effect
    useEffect(function () {
        var trackId = track === null || track === void 0 ? void 0 : track.track_id;
        if (!trackId)
            return;
        var playCounterTimeout = setTimeout(function () {
            if (isReachable) {
                dispatch(recordListen(trackId));
            }
            else {
                dispatch(addOfflineEntries({ items: [{ type: 'play-count', id: trackId }] }));
            }
        }, RECORD_LISTEN_SECONDS);
        return function () { return clearTimeout(playCounterTimeout); };
    }, [counter, dispatch, isReachable, track === null || track === void 0 ? void 0 : track.track_id]);
    var seekToRef = useRef(null);
    var setSeekPosition = useCallback(function (seekPos) {
        if (seekPos === void 0) { seekPos = 0; }
        return __awaiter(void 0, void 0, void 0, function () {
            var currentState, isSeekableState;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TrackPlayer.getState()];
                    case 1:
                        currentState = _a.sent();
                        isSeekableState = currentState === State.Playing || currentState === State.Ready;
                        // Delay calling seekTo if we are not currently in a seekable state
                        // Delayed seeking is handle in handlePlayerStateChange
                        if (isSeekableState) {
                            TrackPlayer.seekTo(seekPos);
                        }
                        else {
                            seekToRef.current = seekPos;
                        }
                        return [2 /*return*/];
                }
            });
        });
    }, []);
    var handlePlayerStateChange = useCallback(function (_a) {
        var state = _a.state;
        return __awaiter(void 0, void 0, void 0, function () {
            var inSeekableState, seekRefValue;
            return __generator(this, function (_b) {
                inSeekableState = state === State.Playing || state === State.Ready;
                seekRefValue = seekToRef.current;
                if (inSeekableState && seekRefValue !== null) {
                    TrackPlayer.seekTo(seekRefValue);
                    seekToRef.current = null;
                }
                return [2 /*return*/];
            });
        });
    }, []);
    TrackPlayer.addEventListener(Event.PlaybackState, handlePlayerStateChange);
    // Seek handler
    useEffect(function () {
        if (seek !== null) {
            setSeekPosition(seek);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seek]);
    // Keep track of the track index the last time counter was updated
    var counterTrackIndex = useRef(null);
    var resetPositionForSameTrack = useCallback(function () {
        // NOTE: Make sure that we only set seek position to 0 when we are restarting a track
        if (queueIndex === counterTrackIndex.current)
            setSeekPosition(0);
        counterTrackIndex.current = queueIndex;
    }, [queueIndex, setSeekPosition]);
    var counterRef = useRef(null);
    // Restart (counter) handler
    useEffect(function () {
        if (counter !== counterRef.current) {
            counterRef.current = counter;
            resetPositionForSameTrack();
        }
    }, [counter, resetPositionForSameTrack]);
    // Ref to keep track of the queue in the track player vs the queue in state
    var queueListRef = useRef([]);
    // A ref to the enqueue task to await before either requeing or appending to queue
    var enqueueTracksJobRef = useRef();
    // A way to abort the enqeue tracks job if a new lineup is played
    var abortEnqueueControllerRef = useRef(new AbortController());
    // The ref of trackQueryParams to avoid re-generating query params for the same track
    var trackQueryParams = useRef({});
    var handleQueueChange = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var refUids, isQueueAppend, newQueueTracks, enqueueTracks, firstTrack, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    refUids = queueListRef.current;
                    if (queueIndex === -1) {
                        return [2 /*return*/];
                    }
                    if (isEqual(refUids, queueTrackUids) &&
                        !didOfflineToggleChange &&
                        !didPlayerBehaviorChange) {
                        return [2 /*return*/];
                    }
                    queueListRef.current = queueTrackUids;
                    isQueueAppend = refUids.length > 0 &&
                        isEqual(queueTrackUids.slice(0, refUids.length), refUids) &&
                        !didPlayerBehaviorChange;
                    // If not an append, cancel the enqueue task first
                    if (!isQueueAppend) {
                        abortEnqueueControllerRef.current.abort();
                    }
                    if (!enqueueTracksJobRef.current) return [3 /*break*/, 2];
                    return [4 /*yield*/, enqueueTracksJobRef.current];
                case 1:
                    _c.sent();
                    _c.label = 2;
                case 2:
                    // Re-init the abort controller now that the enqueue job is done
                    abortEnqueueControllerRef.current = new AbortController();
                    newQueueTracks = isQueueAppend
                        ? queueTracks.slice(refUids.length)
                        : queueTracks;
                    enqueueTracks = function (queuableTracks, queueIndex) {
                        if (queueIndex === void 0) { queueIndex = -1; }
                        return __awaiter(void 0, void 0, void 0, function () {
                            var currentPivot, nextTrack, _a, _b, previousTrack, _c, _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        currentPivot = 1;
                                        _e.label = 1;
                                    case 1:
                                        if (!(queueIndex - currentPivot >= 0 ||
                                            queueIndex + currentPivot < queueTracks.length)) return [3 /*break*/, 8];
                                        if (abortEnqueueControllerRef.current.signal.aborted) {
                                            return [2 /*return*/];
                                        }
                                        nextTrack = queuableTracks[queueIndex + currentPivot];
                                        if (!nextTrack) return [3 /*break*/, 4];
                                        _b = (_a = TrackPlayer).add;
                                        return [4 /*yield*/, makeTrackData(nextTrack)];
                                    case 2: return [4 /*yield*/, _b.apply(_a, [_e.sent()])];
                                    case 3:
                                        _e.sent();
                                        _e.label = 4;
                                    case 4:
                                        previousTrack = queuableTracks[queueIndex - currentPivot];
                                        if (!previousTrack) return [3 /*break*/, 7];
                                        _d = (_c = TrackPlayer).add;
                                        return [4 /*yield*/, makeTrackData(previousTrack)];
                                    case 5: return [4 /*yield*/, _d.apply(_c, [_e.sent(), 0])];
                                    case 6:
                                        _e.sent();
                                        _e.label = 7;
                                    case 7:
                                        currentPivot++;
                                        return [3 /*break*/, 1];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    if (!isQueueAppend) return [3 /*break*/, 4];
                    enqueueTracksJobRef.current = enqueueTracks(newQueueTracks);
                    return [4 /*yield*/, enqueueTracksJobRef.current];
                case 3:
                    _c.sent();
                    enqueueTracksJobRef.current = undefined;
                    return [3 /*break*/, 10];
                case 4: return [4 /*yield*/, TrackPlayer.reset()];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, TrackPlayer.play()];
                case 6:
                    _c.sent();
                    firstTrack = newQueueTracks[queueIndex];
                    if (!firstTrack)
                        return [2 /*return*/];
                    _b = (_a = TrackPlayer).add;
                    return [4 /*yield*/, makeTrackData(firstTrack)];
                case 7: return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                case 8:
                    _c.sent();
                    enqueueTracksJobRef.current = enqueueTracks(newQueueTracks, queueIndex);
                    return [4 /*yield*/, enqueueTracksJobRef.current];
                case 9:
                    _c.sent();
                    enqueueTracksJobRef.current = undefined;
                    _c.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    }); }, [
        queueIndex,
        queueTrackUids,
        didOfflineToggleChange,
        didPlayerBehaviorChange,
        queueTracks,
        makeTrackData
    ]);
    var handleQueueIdxChange = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var playerIdx, queue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, enqueueTracksJobRef.current];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, TrackPlayer.getActiveTrackIndex()];
                case 2:
                    playerIdx = _a.sent();
                    return [4 /*yield*/, TrackPlayer.getQueue()];
                case 3:
                    queue = _a.sent();
                    if (!(queueIndex !== -1 &&
                        queueIndex !== playerIdx &&
                        queueIndex < queue.length)) return [3 /*break*/, 5];
                    return [4 /*yield*/, TrackPlayer.skip(queueIndex)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); }, [queueIndex]);
    var handleTogglePlay = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!playing) return [3 /*break*/, 2];
                    return [4 /*yield*/, TrackPlayer.play()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, TrackPlayer.pause()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [playing]);
    var handleStop = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            TrackPlayer.reset();
            return [2 /*return*/];
        });
    }); }, []);
    var handleRepeatModeChange = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(repeatMode === RepeatMode.SINGLE)) return [3 /*break*/, 2];
                    return [4 /*yield*/, TrackPlayer.setRepeatMode(TrackPlayerRepeatMode.Track)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!(repeatMode === RepeatMode.ALL)) return [3 /*break*/, 4];
                    return [4 /*yield*/, TrackPlayer.setRepeatMode(TrackPlayerRepeatMode.Queue)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, TrackPlayer.setRepeatMode(TrackPlayerRepeatMode.Off)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); }, [repeatMode]);
    var handlePlaybackRateChange = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isLongFormContentRef.current)
                        return [2 /*return*/];
                    return [4 /*yield*/, TrackPlayer.setRate(playbackRateValueMap[playbackRate])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [playbackRate]);
    useEffect(function () {
        if (isAudioSetup) {
            handleRepeatModeChange();
        }
    }, [handleRepeatModeChange, repeatMode, isAudioSetup]);
    useEffect(function () {
        if (isAudioSetup) {
            handleQueueChange();
        }
    }, [handleQueueChange, queueTrackUids, isAudioSetup]);
    useAsync(function () { return __awaiter(void 0, void 0, void 0, function () {
        var updatedTrack;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(isAudioSetup && didPlayerBehaviorChange)) return [3 /*break*/, 3];
                    return [4 /*yield*/, makeTrackData(queueTracks[queueIndex])];
                case 1:
                    updatedTrack = _c.sent();
                    return [4 /*yield*/, TrackPlayer.load(updatedTrack)];
                case 2:
                    _c.sent();
                    updatePlayerInfo({
                        previewing: calculatePlayerBehavior(queueTracks[queueIndex].track, queueTracks[queueIndex].playerBehavior).shouldPreview,
                        trackId: (_b = (_a = queueTracks[queueIndex].track) === null || _a === void 0 ? void 0 : _a.track_id) !== null && _b !== void 0 ? _b : 0,
                        uid: queueTrackUids[queueIndex]
                    });
                    _c.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [didPlayerBehaviorChange]);
    useEffect(function () {
        if (isAudioSetup) {
            handleQueueIdxChange();
        }
    }, [handleQueueIdxChange, queueIndex, isAudioSetup]);
    useEffect(function () {
        if (isAudioSetup) {
            handleTogglePlay();
        }
    }, [handleTogglePlay, playing, isAudioSetup]);
    useEffect(function () {
        handlePlaybackRateChange();
    }, [handlePlaybackRateChange, playbackRate]);
    useEffect(function () {
        // Stop playback if we have unloaded a uid from the player
        if (previousUid && !uid && !playing) {
            handleStop();
        }
    }, [handleStop, playing, uid, previousUid]);
    useSavePodcastProgress();
    return null;
};
