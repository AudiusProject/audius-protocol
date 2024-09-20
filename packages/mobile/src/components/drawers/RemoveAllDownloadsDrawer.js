import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearOfflineDownloads } from 'app/store/offline-downloads/slice';
import { ConfirmationDrawer } from './ConfirmationDrawer';
var messages = {
    header: 'Are You Sure?',
    description: 'Are you sure you want to remove all of your downloaded content?',
    confirm: 'Remove All Downloads'
};
var drawerName = 'RemoveAllDownloads';
export var RemoveAllDownloadsDrawer = function () {
    var dispatch = useDispatch();
    var handleConfirm = useCallback(function () {
        // TODO: some tasks can sneak through after. Need to stop the queue and cancel in-progress jobs
        dispatch(clearOfflineDownloads());
    }, [dispatch]);
    return (<ConfirmationDrawer drawerName={drawerName} messages={messages} onConfirm={handleConfirm}/>);
};
