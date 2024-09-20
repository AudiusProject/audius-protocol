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
import { reachabilityActions } from '@audius/common/store';
import NetInfo from '@react-native-community/netinfo';
import { debounce } from 'lodash';
import { AppState } from 'react-native';
import { env } from 'app/env';
import { dispatch } from 'app/store';
import { setCurrentNetworkType } from 'app/store/offline-downloads/slice';
var REACHABILITY_URL = env.REACHABILITY_URL;
export var checkNetInfoReachability = function (netInfo) {
    if (!netInfo)
        return true;
    var isInternetReachable = netInfo.isInternetReachable;
    return !!isInternetReachable;
};
// Check that a response from REACHABILITY_URL is valid
var isResponseValid = function (response) {
    return response && response.ok;
};
export var pingTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // If there's no reachability url available, consider ourselves reachable
                if (!REACHABILITY_URL) {
                    console.warn('No reachability url provided');
                    return [2 /*return*/, true];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetch(REACHABILITY_URL, { method: 'GET' })];
            case 2:
                response = _b.sent();
                if (isResponseValid(response)) {
                    console.debug('Reachability call succeeded');
                    return [2 /*return*/, true];
                }
                console.debug('Reachability call failed');
                return [2 /*return*/, false];
            case 3:
                _a = _b.sent();
                console.debug('Reachability call failed');
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
var updateReachability = function (netInfoState) { return __awaiter(void 0, void 0, void 0, function () {
    var newValue, appState, reachable;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                newValue = checkNetInfoReachability(netInfoState);
                if (!!newValue) return [3 /*break*/, 2];
                appState = AppState.currentState;
                if (appState !== 'active')
                    return [2 /*return*/];
                return [4 /*yield*/, pingTest()];
            case 1:
                reachable = _a.sent();
                if (!reachable) {
                    setUnreachable(true);
                }
                dispatch(setCurrentNetworkType({ currentNetworkType: netInfoState.type }));
                return [3 /*break*/, 3];
            case 2:
                // Supercede the setUnreachable debounce if necessary
                setUnreachable(false);
                dispatch(reachabilityActions.setReachable());
                dispatch(setCurrentNetworkType({ currentNetworkType: netInfoState.type }));
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
/** Debounce calls only for reachable -> unreachable */
var setUnreachable = debounce(function (isUnreachable) {
    if (isUnreachable) {
        dispatch(reachabilityActions.setUnreachable());
    }
}, 2500, { maxWait: 5000 });
export var forceRefreshConnectivity = function () { return __awaiter(void 0, void 0, void 0, function () {
    var updatedNetInfoState;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                NetInfo.refresh();
                return [4 /*yield*/, NetInfo.fetch()];
            case 1:
                updatedNetInfoState = _a.sent();
                updateReachability(updatedNetInfoState);
                return [2 /*return*/];
        }
    });
}); };
/** Called on first app render */
export var subscribeToNetworkStatusUpdates = function () {
    NetInfo.addEventListener(updateReachability);
};
