var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import Color from 'color';
import { set } from 'lodash';
/**
 * Colorizes a lottie file given the paths of elements
 * Lifted from
 * https://github.com/lottie-react-native/lottie-react-native/issues/671#issuecomment-823157024
 * Path context can be computed using this tool:
 * https://github.com/Noitidart/Colorize-Lottie
 */
export var colorize = function (json, colorByPath) {
    var nextJson = JSON.parse(JSON.stringify(json));
    Object.entries(colorByPath).forEach(function (_a) {
        var path = _a[0], color = _a[1];
        if (!color)
            return;
        var rgbValues = Color(color).object();
        var rFraction = rgbValues.r / 255;
        var gFraction = rgbValues.g / 255;
        var bFraction = rgbValues.b / 255;
        var pathParts = path.split('.');
        set(nextJson, __spreadArray(__spreadArray([], pathParts, true), [0], false), rFraction);
        set(nextJson, __spreadArray(__spreadArray([], pathParts, true), [1], false), gFraction);
        set(nextJson, __spreadArray(__spreadArray([], pathParts, true), [2], false), bFraction);
    });
    return nextJson;
};
