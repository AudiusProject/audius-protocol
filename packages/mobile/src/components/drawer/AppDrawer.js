var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useCallback } from 'react';
import { modalsSelectors, modalsActions } from '@audius/common/store';
import { useDispatch, useSelector } from 'react-redux';
import { Drawer } from './Drawer';
var setVisibility = modalsActions.setVisibility;
var getModalVisibility = modalsSelectors.getModalVisibility;
export var useDrawerState = function (modalName) {
    var dispatch = useDispatch();
    var modalState = useSelector(function (state) {
        return getModalVisibility(state, modalName);
    });
    var handleClose = useCallback(function () {
        dispatch(setVisibility({ modal: modalName, visible: 'closing' }));
    }, [dispatch, modalName]);
    var handleClosed = useCallback(function () {
        dispatch(setVisibility({ modal: modalName, visible: false }));
    }, [dispatch, modalName]);
    return {
        isOpen: modalState === true,
        modalState: modalState,
        onClose: handleClose,
        onClosed: handleClosed
    };
};
/*
 * Drawer that hooks into the common modal slice to automatically handle
 * opening and closing.
 */
export var AppDrawer = function (props) {
    var modalName = props.modalName, onCloseProp = props.onClose, other = __rest(props, ["modalName", "onClose"]);
    var _a = useDrawerState(modalName), isOpen = _a.isOpen, onClose = _a.onClose, onClosed = _a.onClosed;
    var handleClose = useCallback(function () {
        onClose();
        onCloseProp === null || onCloseProp === void 0 ? void 0 : onCloseProp();
    }, [onClose, onCloseProp]);
    return (<Drawer isOpen={isOpen} onClose={handleClose} onClosed={onClosed} {...other}/>);
};
