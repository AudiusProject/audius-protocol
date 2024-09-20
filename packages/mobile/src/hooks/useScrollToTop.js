var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
/**
 * A hook that listens for `scrollToTop` event on all parent navigators
 * When the nearest navigator is type `tab`, listens to `tabPress` event
 *
 * react-navigation exports `useScrollToTop` but it doesn't support nested navigators
 * see: https://github.com/react-navigation/react-navigation/issues/8586
 */
export var useScrollToTop = function (scrollToTop, disableTopTabScroll) {
    if (disableTopTabScroll === void 0) { disableTopTabScroll = false; }
    var navigation = useNavigation();
    useFocusEffect(useCallback(function () {
        var _a;
        var parents = getParentNavigators(navigation);
        var removeListeners = parents.map(function (p) {
            return p.addListener('scrollToTop', function () {
                scrollToTop();
            });
        });
        var removeTabListeners = (((_a = navigation.getState()) === null || _a === void 0 ? void 0 : _a.type) === 'tab' && !disableTopTabScroll
            ? ['tabPress', 'tabLongPress']
            : []).map(function (e) {
            return navigation.addListener(e, function () {
                scrollToTop();
            });
        });
        return function () {
            removeListeners.forEach(function (r) { return r(); });
            removeTabListeners.forEach(function (r) { return r(); });
        };
    }, [navigation, scrollToTop, disableTopTabScroll]));
};
/**
 * Get array of all parent navigators
 */
var getParentNavigators = function (navigation, parents) {
    if (parents === void 0) { parents = []; }
    if (!navigation) {
        return parents;
    }
    var parent = navigation.getParent();
    return getParentNavigators(parent, __spreadArray([navigation], parents, true));
};
