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
import { useCallback, useEffect, useState } from 'react';
import { SquareSizes } from '@audius/common/models';
import { cacheUsersSelectors, castActions, playerSelectors, playerActions } from '@audius/common/store';
import { CastState, MediaPlayerState, useCastState, useMediaStatus, useRemoteMediaClient } from 'react-native-google-cast';
import TrackPlayer, { Event } from 'react-native-track-player';
import { useDispatch, useSelector } from 'react-redux';
import { useAsync, usePrevious } from 'react-use';
import { audiusBackendInstance } from 'app/services/audius-backend-instance';
var setIsCasting = castActions.setIsCasting;
var getCurrentTrack = playerSelectors.getCurrentTrack, getPlaying = playerSelectors.getPlaying, getSeek = playerSelectors.getSeek, getCounter = playerSelectors.getCounter;
var getUser = cacheUsersSelectors.getUser;
export { CastState, MediaPlayerState } from 'react-native-google-cast';
export var useChromecast = function () {
    var dispatch = useDispatch();
    // Data hooks
    var counter = useSelector(getCounter);
    var track = useSelector(getCurrentTrack);
    var prevTrack = usePrevious(track);
    var playing = useSelector(getPlaying);
    var seek = useSelector(getSeek);
    var owner = useSelector(function (state) {
        return getUser(state, {
            id: track === null || track === void 0 ? void 0 : track.owner_id
        });
    });
    // Cast hooks
    var client = useRemoteMediaClient();
    var castState = useCastState();
    var mediaStatus = useMediaStatus();
    var previousCastState = usePrevious(castState);
    var _a = useState(0), internalCounter = _a[0], setInternalCounter = _a[1];
    var loadCast = useCallback(function (track, startTime, contentUrl) { return __awaiter(void 0, void 0, void 0, function () {
        var imageUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(client && track && owner && contentUrl)) return [3 /*break*/, 2];
                    return [4 /*yield*/, audiusBackendInstance.getImageUrl(track.cover_art_sizes, SquareSizes.SIZE_1000_BY_1000, track.cover_art_cids)];
                case 1:
                    imageUrl = _a.sent();
                    client.loadMedia({
                        mediaInfo: {
                            contentUrl: contentUrl,
                            metadata: {
                                type: 'musicTrack',
                                images: [
                                    {
                                        url: imageUrl
                                    }
                                ],
                                title: track.title,
                                artist: owner.name
                            }
                        },
                        startTime: startTime
                    });
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, [client, owner]);
    var playCast = useCallback(function () {
        client === null || client === void 0 ? void 0 : client.play();
    }, [client]);
    var pauseCast = useCallback(function () {
        client === null || client === void 0 ? void 0 : client.pause();
    }, [client]);
    // Update our cast UI when the cast device connects
    useEffect(function () {
        switch (castState) {
            case CastState.CONNECTED:
                dispatch(setIsCasting({ isCasting: true }));
                break;
            default:
                dispatch(setIsCasting({ isCasting: false }));
                break;
        }
    }, [castState, dispatch]);
    // Ensure that the progress gets reset to 0
    // when a new track is played
    useEffect(function () {
        if (prevTrack && prevTrack !== track && counter !== internalCounter) {
            setInternalCounter(0);
        }
    }, [prevTrack, track, counter, internalCounter, setInternalCounter]);
    // Load media when the cast connects
    useAsync(function () { return __awaiter(void 0, void 0, void 0, function () {
        var currentPosition, currentPlaying;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(castState === CastState.CONNECTED)) return [3 /*break*/, 3];
                    return [4 /*yield*/, TrackPlayer.getPosition()];
                case 1:
                    currentPosition = _a.sent();
                    return [4 /*yield*/, TrackPlayer.getActiveTrack()];
                case 2:
                    currentPlaying = _a.sent();
                    if (currentPlaying) {
                        loadCast(track, currentPosition, currentPlaying === null || currentPlaying === void 0 ? void 0 : currentPlaying.url);
                    }
                    else {
                        // If nothing is currently playing, listen for something to start
                        // playing and then load it to cast.
                        TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, function () { return __awaiter(void 0, void 0, void 0, function () {
                            var currentPosition, currentPlaying;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, TrackPlayer.getPosition()];
                                    case 1:
                                        currentPosition = _a.sent();
                                        return [4 /*yield*/, TrackPlayer.getActiveTrack()];
                                    case 2:
                                        currentPlaying = _a.sent();
                                        loadCast(track, currentPosition, currentPlaying === null || currentPlaying === void 0 ? void 0 : currentPlaying.url);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [castState, track, loadCast]);
    // Play & pause the cast device
    useEffect(function () {
        if (castState === CastState.CONNECTED) {
            if (playing) {
                playCast();
            }
            else {
                pauseCast();
            }
        }
    }, [playing, playCast, pauseCast, castState]);
    // Set buffering state when cast is buffering
    useEffect(function () {
        if (castState === CastState.CONNECTING ||
            ((mediaStatus === undefined ||
                (mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.playerState) === undefined ||
                (mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.playerState) === MediaPlayerState.IDLE ||
                (mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.playerState) === MediaPlayerState.LOADING ||
                (mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.playerState) === MediaPlayerState.BUFFERING) &&
                castState !== CastState.NOT_CONNECTED)) {
            dispatch(playerActions.setBuffering({ buffering: true }));
        }
        else {
            dispatch(playerActions.setBuffering({ buffering: false }));
        }
    }, [mediaStatus, castState, dispatch]);
    // Seek the cast device
    useEffect(function () {
        if (seek !== null) {
            client === null || client === void 0 ? void 0 : client.seek({ position: seek });
        }
    }, [client, seek]);
    // Mute the track player if we are connecting to cast
    useEffect(function () {
        if (castState === CastState.CONNECTED ||
            castState === CastState.CONNECTING) {
            TrackPlayer.setVolume(0);
        }
    }, [castState]);
    // Handle disconnection from cast device
    useEffect(function () {
        if (castState === CastState.NOT_CONNECTED &&
            previousCastState === CastState.CONNECTED) {
            TrackPlayer.setVolume(1);
            dispatch(playerActions.pause());
        }
    }, [castState, previousCastState, dispatch]);
    return {
        castState: castState
    };
};
