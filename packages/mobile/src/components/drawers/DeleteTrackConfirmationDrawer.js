import { useCallback } from 'react';
import { cacheTracksActions } from '@audius/common/store';
import { useDispatch } from 'react-redux';
import { useDrawer } from 'app/hooks/useDrawer';
import { useNavigation } from 'app/hooks/useNavigation';
import { navigationRef } from '../navigation-container/NavigationContainer';
import { ConfirmationDrawer } from './ConfirmationDrawer';
var deleteTrack = cacheTracksActions.deleteTrack;
var messages = {
    header: 'Delete Track',
    description: 'This Track Will Disappear For Everyone',
    confirm: 'Delete Track',
    cancel: 'Nevermind'
};
var drawerName = 'DeleteTrackConfirmation';
export var DeleteTrackConfirmationDrawer = function () {
    var data = useDrawer(drawerName).data;
    var trackId = data.trackId;
    var dispatch = useDispatch();
    var navigation = useNavigation();
    var handleConfirm = useCallback(function () {
        var _a;
        dispatch(deleteTrack(trackId));
        var currentRouteName = (_a = navigationRef.getCurrentRoute()) === null || _a === void 0 ? void 0 : _a.name;
        if (currentRouteName === 'Track') {
            navigation.goBack();
        }
    }, [dispatch, trackId, navigation]);
    return (<ConfirmationDrawer drawerName={drawerName} messages={messages} onConfirm={handleConfirm}/>);
};
