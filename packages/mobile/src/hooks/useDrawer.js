import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getData, getVisibility } from 'app/store/drawers/selectors';
import { setVisibility } from 'app/store/drawers/slice';
export var useDrawer = function (drawerName) {
    var dispatch = useDispatch();
    var visibleState = useSelector(getVisibility(drawerName));
    var data = useSelector(function (state) {
        return getData(state, drawerName);
    });
    var isOpen = visibleState === true;
    var onClose = useCallback(function () {
        dispatch(setVisibility({ drawer: drawerName, visible: 'closing' }));
    }, [dispatch, drawerName]);
    var onClosed = useCallback(function () {
        dispatch(setVisibility({ drawer: drawerName, visible: false }));
    }, [dispatch, drawerName]);
    var onOpen = useCallback(function (data) {
        dispatch(setVisibility({ drawer: drawerName, visible: true, data: data }));
    }, [dispatch, drawerName]);
    return { isOpen: isOpen, onClose: onClose, onClosed: onClosed, onOpen: onOpen, visibleState: visibleState, data: data };
};
