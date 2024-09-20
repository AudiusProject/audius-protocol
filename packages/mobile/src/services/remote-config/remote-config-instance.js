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
import { ErrorLevel } from '@audius/common/models';
import { remoteConfig } from '@audius/common/services';
import * as optimizely from '@optimizely/optimizely-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import codePush from 'react-native-code-push';
import Config from 'react-native-config';
import VersionNumber from 'react-native-version-number';
import { env } from 'app/env';
import { reportToSentry } from 'app/utils/reportToSentry';
import packageInfo from '../../../package.json';
export var FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY = 'featureFlagSessionId-2';
var appVersion = packageInfo.version;
var OPTIMIZELY_KEY = env.OPTIMIZELY_KEY;
var DATA_FILE_URL = 'https://experiments.audius.co/datafiles/%s.json';
/** Returns mobile platform (ios or android), mobile app version, and code push update number (if any) */
var getMobileClientInfo = function () { return __awaiter(void 0, void 0, void 0, function () {
    var mobilePlatform, mobileAppVersion, codePushUpdateMetadata, e_1, codePushUpdateNumber;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                mobilePlatform = Platform.OS;
                mobileAppVersion = VersionNumber.appVersion;
                codePushUpdateMetadata = null;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, codePush.getUpdateMetadata()];
            case 2:
                codePushUpdateMetadata = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.error('Error getting CodePush metadata for remote config instance.', e_1);
                return [3 /*break*/, 4];
            case 4:
                if (codePushUpdateMetadata &&
                    codePushUpdateMetadata.label &&
                    codePushUpdateMetadata.label.length > 1) {
                    // Codepush version nunbers are formatted as e.g."v10" - remove the leading "v".
                    codePushUpdateNumber = Number(codePushUpdateMetadata.label.slice(1));
                }
                return [2 /*return*/, {
                        mobilePlatform: mobilePlatform,
                        mobileAppVersion: mobileAppVersion,
                        codePushUpdateNumber: codePushUpdateNumber
                    }];
        }
    });
}); };
export var remoteConfigInstance = remoteConfig({
    appVersion: appVersion,
    platform: 'mobile',
    getMobileClientInfo: getMobileClientInfo,
    createOptimizelyClient: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, optimizely.createInstance({
                    sdkKey: OPTIMIZELY_KEY,
                    datafileOptions: {
                        urlTemplate: DATA_FILE_URL
                    },
                    errorHandler: {
                        handleError: function (error) {
                            reportToSentry({
                                level: ErrorLevel.Error,
                                error: error,
                                name: 'Optimizely failed to load'
                            });
                        }
                    }
                })];
        });
    }); },
    getFeatureFlagSessionId: function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, AsyncStorage.getItem(FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY)];
                case 1:
                    sessionId = _a.sent();
                    return [2 /*return*/, sessionId ? parseInt(sessionId) : null];
            }
        });
    }); },
    setFeatureFlagSessionId: function (id) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, AsyncStorage.setItem(FEATURE_FLAG_ASYNC_STORAGE_SESSION_KEY, id.toString())];
    }); }); },
    setLogLevel: function () { return optimizely.setLogLevel('warn'); },
    environment: Config.ENVIRONMENT
});
remoteConfigInstance.init();
