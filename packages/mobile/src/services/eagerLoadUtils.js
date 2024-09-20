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
import { getEagerDiscprov, makeEagerRequest } from '@audius/common/services';
/**
 * Utilities to assist in eager pre-fetching content from the
 * protocol before libs has initialized.
 */
import { env } from 'app/env';
import { audiusLibs, waitForLibsInit } from './libs';
import { localStorage } from './local-storage';
/**
 * Wraps a normal libs method call with method that calls the
 * provided eager variant if libs is not already loaded.
 * In the case the eager version returns an error, we wait for
 * libs to inititalize and then call the normal method.
 */
export var withEagerOption = function (_a) {
    var normal = _a.normal, eager = _a.eager, endpoint = _a.endpoint, _b = _a.requiresUser, requiresUser = _b === void 0 ? false : _b;
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, void 0, void 0, function () {
        var disprovEndpoint, _c, req, res, e_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!(endpoint !== null && endpoint !== void 0)) return [3 /*break*/, 1];
                    _c = endpoint;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, getEagerDiscprov(localStorage, env)];
                case 2:
                    _c = (_d.sent());
                    _d.label = 3;
                case 3:
                    disprovEndpoint = _c;
                    if (!audiusLibs) return [3 /*break*/, 4];
                    return [2 /*return*/, normal(audiusLibs).apply(void 0, args)];
                case 4:
                    _d.trys.push([4, 6, , 8]);
                    req = eager.apply(void 0, args);
                    return [4 /*yield*/, makeEagerRequest(req, disprovEndpoint, requiresUser, localStorage, env)];
                case 5:
                    res = _d.sent();
                    return [2 /*return*/, res];
                case 6:
                    e_1 = _d.sent();
                    return [4 /*yield*/, waitForLibsInit()];
                case 7:
                    _d.sent();
                    return [2 /*return*/, normal(audiusLibs).apply(void 0, args)];
                case 8: return [2 /*return*/];
            }
        });
    });
};
