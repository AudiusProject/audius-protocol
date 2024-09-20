import { useEffect } from 'react';
import { accountSelectors, cacheTracksSelectors, playerSelectors, playbackPositionActions } from '@audius/common/store';
import { isLongFormContent } from '@audius/common/utils';
import { useProgress } from 'react-native-track-player';
import { useDispatch, useSelector } from 'react-redux';
var getPlaying = playerSelectors.getPlaying, getTrackId = playerSelectors.getTrackId;
var getTrack = cacheTracksSelectors.getTrack;
var getUserId = accountSelectors.getUserId;
var setTrackPosition = playbackPositionActions.setTrackPosition;
export var useSavePodcastProgress = function () {
    var position = useProgress().position;
    var dispatch = useDispatch();
    var isPlayingLongFormContent = useSelector(function (state) {
        var trackId = getTrackId(state);
        var track = getTrack(state, { id: trackId });
        if (!track)
            return false;
        var isPlaying = getPlaying(state);
        return isLongFormContent(track) && isPlaying;
    });
    var userId = useSelector(getUserId);
    var trackId = useSelector(getTrackId);
    useEffect(function () {
        if (isPlayingLongFormContent && userId && trackId) {
            dispatch(setTrackPosition({
                userId: userId,
                trackId: trackId,
                positionInfo: { status: 'IN_PROGRESS', playbackPosition: position }
            }));
        }
    }, [position, isPlayingLongFormContent, userId, trackId, dispatch]);
};
