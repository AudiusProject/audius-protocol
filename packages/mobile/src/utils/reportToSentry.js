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
import { ErrorLevel } from '@audius/common/models';
import { getErrorMessage, isResponseError } from '@audius/common/utils';
import { captureException, withScope } from '@sentry/react-native';
import { versionInfo } from './appVersionWithCodepush';
var Levels = {
    Warning: 'warning',
    Fatal: 'fatal',
    Debug: 'debug',
    Error: 'error',
    Info: 'info',
    Log: 'log'
};
var jsLoggerMapping = {
    Warning: 'warn',
    Fatal: 'error',
    Debug: 'debug',
    Error: 'error',
    Info: 'info',
    Log: 'log'
};
/**
 * Helper fn that reports to sentry while creating a localized scope to contain additional data
 * Also logs to console with the appropriate level (console.log, console.warn, console.error, etc)
 */
export var reportToSentry = function (_a) {
    var _b = _a.level, level = _b === void 0 ? ErrorLevel.Error : _b, additionalInfo = _a.additionalInfo, error = _a.error, tags = _a.tags, name = _a.name;
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_c) {
            try {
                withScope(function (scope) { return __awaiter(void 0, void 0, void 0, function () {
                    var responseBody, _a, consoleMethod;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                scope.setExtra('mobileClientVersionInclOTA', versionInfo !== null && versionInfo !== void 0 ? versionInfo : 'unknown');
                                if (level) {
                                    scope.setLevel(Levels[level]);
                                }
                                if (!isResponseError(error)) return [3 /*break*/, 5];
                                return [4 /*yield*/, error.response.json().catch()];
                            case 1:
                                if (!((_b = (_c.sent())) !== null && _b !== void 0)) return [3 /*break*/, 2];
                                _a = _b;
                                return [3 /*break*/, 4];
                            case 2: return [4 /*yield*/, error.response.text().catch()];
                            case 3:
                                _a = (_c.sent());
                                _c.label = 4;
                            case 4:
                                responseBody = _a;
                                additionalInfo = __assign(__assign({}, additionalInfo), { response: error.response, requestId: error.response.headers.get('X-Request-ID'), responseBody: responseBody });
                                _c.label = 5;
                            case 5:
                                if (additionalInfo) {
                                    scope.setContext('additionalInfo', additionalInfo);
                                }
                                if (name) {
                                    error.name = "".concat(name, ": ").concat(error.name);
                                }
                                if (tags) {
                                    scope.setTags(tags);
                                }
                                consoleMethod = jsLoggerMapping[level || ErrorLevel.Log] || jsLoggerMapping.Log;
                                // eslint-disable-next-line no-console
                                console[consoleMethod](error, 'More info in console.debug');
                                if (additionalInfo || tags) {
                                    console.debug('Additional error info:', { additionalInfo: additionalInfo, tags: tags, level: level });
                                }
                                captureException(error);
                                return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (error) {
                console.error("Got error trying to log error: ".concat(getErrorMessage(error)));
            }
            return [2 /*return*/];
        });
    });
};
