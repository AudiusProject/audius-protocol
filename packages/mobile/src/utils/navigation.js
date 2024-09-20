var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * Navigation state selector that selects the current route
 * Can be passed to useNavigationState
 */
export var getRoutePath = function (state, routePath) {
    if (!state || state.routes.length === 0) {
        return routePath;
    }
    var _a = state.routes[state.index], subState = _a.state, name = _a.name;
    return getRoutePath(subState, __spreadArray(__spreadArray([], (routePath !== null && routePath !== void 0 ? routePath : []), true), [name], false));
};
/**
 * Navigation state selector that selects the primary route
 * e.g. 'feed', 'trending', 'profile', etc
 */
export var getPrimaryRoute = function (state) {
    var _a;
    // The route at index 2 is the primary route
    return (_a = getRoutePath(state)) === null || _a === void 0 ? void 0 : _a[2];
};
/**
 * Given a navigator, get the nearest stack navigator in the hierarchy
 */
export var getNearestStackNavigator = function (navigator) {
    var _a, _b;
    if (((_b = (_a = navigator.getState) === null || _a === void 0 ? void 0 : _a.call(navigator)) === null || _b === void 0 ? void 0 : _b.type) === 'stack') {
        return navigator;
    }
    var parent = navigator.getParent();
    if (!parent) {
        return undefined;
    }
    return getNearestStackNavigator(parent);
};
