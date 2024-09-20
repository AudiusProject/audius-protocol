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
import { useCallback } from 'react';
import { toastActions } from '@audius/common/store';
import { uuid } from '@audius/common/utils';
import { useDispatch } from 'react-redux';
var registerToast = toastActions.registerToast;
export var useToast = function () {
    var dispatch = useDispatch();
    var handleToast = useCallback(function (toast) {
        dispatch(registerToast(__assign(__assign({}, toast), { key: uuid() })));
    }, [dispatch]);
    return { toast: handleToast };
};
