var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
import { Linking, Pressable } from 'react-native';
import { useToast } from 'app/hooks/useToast';
import { make, track } from 'app/services/analytics';
import { EventNames } from 'app/types/analytics';
var messages = {
    error: 'Unable to open this URL'
};
export var useOnOpenLink = function (source) {
    var toast = useToast().toast;
    var handlePress = useCallback(function (url) { return __awaiter(void 0, void 0, void 0, function () {
        var errorToastConfig, supported, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    errorToastConfig = {
                        content: messages.error,
                        type: 'error'
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, Linking.canOpenURL(url)];
                case 2:
                    supported = _a.sent();
                    if (!supported) return [3 /*break*/, 4];
                    return [4 /*yield*/, Linking.openURL(url)];
                case 3:
                    _a.sent();
                    if (source) {
                        track(make({ eventName: EventNames.LINK_CLICKING, url: url, source: source }));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    toast(errorToastConfig);
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    toast(errorToastConfig);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [toast, source]);
    return handlePress;
};
export var useLink = function (url) {
    var onPressLink = useOnOpenLink();
    var handlePress = useCallback(function () {
        return onPressLink(url);
    }, [url, onPressLink]);
    return { onPress: handlePress };
};
export var Link = function (props) {
    var url = props.url, onPress = props.onPress, analytics = props.analytics, other = __rest(props, ["url", "onPress", "analytics"]);
    var onPressLink = useLink(url).onPress;
    var handlePress = useCallback(function (event) {
        onPress === null || onPress === void 0 ? void 0 : onPress(event);
        onPressLink();
        if (analytics) {
            track(analytics);
        }
    }, [onPress, onPressLink, analytics]);
    return <Pressable onPress={handlePress} {...other}/>;
};
