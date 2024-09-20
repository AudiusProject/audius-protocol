import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { requestRemoveAllDownloadedFavorites } from 'app/store/offline-downloads/slice';
import { ConfirmationDrawer } from './ConfirmationDrawer';
var messages = {
    header: 'Are You Sure?',
    description: 'Are you sure you want to remove all of your downloaded favorites?',
    confirm: 'Remove All Downloads'
};
var drawerName = 'RemoveDownloadedFavorites';
export var RemoveDownloadedFavoritesDrawer = function () {
    var dispatch = useDispatch();
    var handleConfirm = useCallback(function () {
        dispatch(requestRemoveAllDownloadedFavorites());
    }, [dispatch]);
    return (<ConfirmationDrawer drawerName={drawerName} messages={messages} onConfirm={handleConfirm}/>);
};
