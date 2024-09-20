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
import { useDrawer } from 'app/hooks/useDrawer';
import Drawer from './Drawer';
/*
 * Drawer that hooks into the native-drawer slice to automatically handle
 * opening and closing.
 */
export var NativeDrawer = function (props) {
    var drawerName = props.drawerName, onCloseProp = props.onClose, onClosedProp = props.onClosed, other = __rest(props, ["drawerName", "onClose", "onClosed"]);
    var _a = useDrawer(drawerName), isOpen = _a.isOpen, onClose = _a.onClose, onClosed = _a.onClosed, visibleState = _a.visibleState;
    var handleClose = useCallback(function () {
        onCloseProp === null || onCloseProp === void 0 ? void 0 : onCloseProp();
        onClose();
    }, [onCloseProp, onClose]);
    var handleClosed = useCallback(function () {
        onClosedProp === null || onClosedProp === void 0 ? void 0 : onClosedProp();
        onClosed();
    }, [onClosed, onClosedProp]);
    if (visibleState === false)
        return null;
    return (<Drawer isOpen={isOpen} onClose={handleClose} onClosed={handleClosed} {...other}/>);
};
