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
import { Amplitude } from '@amplitude/react-native';
import VersionNumber from 'react-native-version-number';
import { env } from 'app/env';
import { versionInfo } from 'app/utils/appVersionWithCodepush';
import packageInfo from '../../package.json';
import { EventNames } from '../types/analytics';
var clientVersion = packageInfo.version;
var analyticsSetupStatus = 'pending';
var AmplitudeWriteKey = env.AMPLITUDE_WRITE_KEY;
var AmplitudeProxy = env.AMPLITUDE_PROXY;
var amplitudeInstance = Amplitude.getInstance();
var IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production';
export var init = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                if (!(AmplitudeWriteKey && AmplitudeProxy)) return [3 /*break*/, 3];
                return [4 /*yield*/, amplitudeInstance.setServerUrl(AmplitudeProxy)];
            case 1:
                _a.sent();
                return [4 /*yield*/, amplitudeInstance.init(AmplitudeWriteKey)];
            case 2:
                _a.sent();
                analyticsSetupStatus = 'ready';
                return [3 /*break*/, 4];
            case 3:
                analyticsSetupStatus = 'error';
                console.error('Analytics unable to setup: missing amplitude write key or proxy url');
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                analyticsSetupStatus = 'error';
                console.error("Amplitude error: ".concat(err_1));
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
var isAudiusSetup = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ready;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(analyticsSetupStatus === 'pending')) return [3 /*break*/, 2];
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var checkStatusInterval = setInterval(function () {
                            if (analyticsSetupStatus === 'pending')
                                return;
                            clearInterval(checkStatusInterval);
                            if (analyticsSetupStatus === 'ready')
                                resolve(true);
                            resolve(false);
                        }, 500);
                    })];
            case 1:
                ready = _a.sent();
                return [2 /*return*/, ready];
            case 2:
                if (analyticsSetupStatus === 'ready')
                    return [2 /*return*/, true];
                else {
                    return [2 /*return*/, false];
                }
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
export var make = function (event) {
    var eventName = event.eventName, props = __rest(event, ["eventName"]);
    return {
        eventName: eventName,
        properties: props
    };
};
// Identify User
// Docs: https://segment.com/docs/connections/spec/identify
export var identify = function (handle, traits) {
    if (traits === void 0) { traits = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var isSetup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, isAudiusSetup()];
                case 1:
                    isSetup = _a.sent();
                    if (!isSetup)
                        return [2 /*return*/];
                    amplitudeInstance.setUserId(handle);
                    amplitudeInstance.setUserProperties(traits);
                    return [2 /*return*/];
            }
        });
    });
};
// Track Event
// Docs: https://segment.com/docs/connections/spec/track/
export var track = function (_a) {
    var eventName = _a.eventName, properties = _a.properties;
    return __awaiter(void 0, void 0, void 0, function () {
        var isSetup, version, propertiesWithContext;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, isAudiusSetup()];
                case 1:
                    isSetup = _b.sent();
                    if (!isSetup)
                        return [2 /*return*/];
                    version = VersionNumber.appVersion;
                    propertiesWithContext = __assign(__assign({}, properties), { clientVersion: clientVersion, isNativeMobile: true, mobileClientVersion: version, mobileClientVersionInclOTA: versionInfo !== null && versionInfo !== void 0 ? versionInfo : 'unknown' });
                    if (!IS_PRODUCTION_BUILD) {
                        console.info('Amplitude | track', eventName, properties);
                    }
                    return [4 /*yield*/, amplitudeInstance.logEvent(eventName, propertiesWithContext)];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
};
// Screen Event
// Docs: https://segment.com/docs/connections/sources/catalog/libraries/mobile/react-native/#screen
export var screen = function (_a) {
    var route = _a.route, _b = _a.properties, properties = _b === void 0 ? {} : _b;
    return __awaiter(void 0, void 0, void 0, function () {
        var isSetup;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, isAudiusSetup()];
                case 1:
                    isSetup = _c.sent();
                    if (!isSetup)
                        return [2 /*return*/];
                    amplitudeInstance.logEvent(EventNames.PAGE_VIEW, __assign({ route: route }, properties));
                    return [2 /*return*/];
            }
        });
    });
};
