import { useCallback, useMemo } from 'react';
import { useGetCurrentUser } from '@audius/common/api';
import { tracksSocialActions, useArtistPickModal } from '@audius/common/store';
import { useDispatch } from 'react-redux';
import { ConfirmationDrawer } from './ConfirmationDrawer';
var messages = {
    add: {
        header: 'Set your Artist Pick',
        description: 'This track will appear at the top of your profile, above your recent uploads, until you change or remove it.',
        confirm: 'Set Track'
    },
    update: {
        header: 'Change your Artist Pick?',
        description: 'This track will appear at the top of your profile and replace your previously picked track.',
        confirm: 'Change Track'
    },
    remove: {
        header: 'Unset as Artist Pick',
        description: 'Are you sure you want to remove your pick? This track will be displayed based on its release date.',
        confirm: 'Unset Track'
    }
};
var setArtistPick = tracksSocialActions.setArtistPick, unsetArtistPick = tracksSocialActions.unsetArtistPick;
export var ArtistPickConfirmationDrawer = function () {
    var data = useArtistPickModal().data;
    var trackId = data.trackId;
    var user = useGetCurrentUser().data;
    var dispatch = useDispatch();
    var action = useMemo(function () { return (!(user === null || user === void 0 ? void 0 : user.artist_pick_track_id) ? 'add' : trackId ? 'update' : 'remove'); }, 
    // We don't want optimistic update, otherwise the text changes as the drawer is closing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackId]);
    var handleConfirm = useCallback(function () {
        if (trackId) {
            dispatch(setArtistPick(trackId));
        }
        else {
            dispatch(unsetArtistPick());
        }
    }, [dispatch, trackId]);
    return (<ConfirmationDrawer variant={action === 'remove' ? 'destructive' : 'affirmative'} modalName='ArtistPick' messages={messages[action]} onConfirm={handleConfirm}/>);
};
