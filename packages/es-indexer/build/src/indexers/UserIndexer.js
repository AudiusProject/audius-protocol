"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserIndexer = void 0;
var lodash_1 = require("lodash");
var conn_1 = require("../conn");
var splitTags_1 = require("../helpers/splitTags");
var indexNames_1 = require("../indexNames");
var BaseIndexer_1 = require("./BaseIndexer");
var sharedIndexSettings_1 = require("./sharedIndexSettings");
var UserIndexer = /** @class */ (function (_super) {
    __extends(UserIndexer, _super);
    function UserIndexer() {
        var _this = _super.call(this, 'users', 'user_id') || this;
        _this.mapping = {
            index: indexNames_1.indexNames.users,
            settings: (0, lodash_1.merge)(sharedIndexSettings_1.sharedIndexSettings, {}),
            mappings: {
                dynamic: false,
                properties: {
                    blocknumber: { type: 'integer' },
                    created_at: { type: 'date' },
                    wallet: sharedIndexSettings_1.lowerKeyword,
                    suggest: sharedIndexSettings_1.standardSuggest,
                    handle: __assign(__assign({}, sharedIndexSettings_1.noWhitespaceLowerKeyword), { fields: {
                            searchable: sharedIndexSettings_1.standardText,
                        } }),
                    name: __assign(__assign({}, sharedIndexSettings_1.lowerKeyword), { fields: {
                            searchable: sharedIndexSettings_1.standardText,
                        } }),
                    is_verified: { type: 'boolean' },
                    is_deactivated: { type: 'boolean' },
                    location: sharedIndexSettings_1.lowerKeyword,
                    // subscribed
                    subscribed_ids: { type: 'keyword' },
                    // following
                    following_ids: { type: 'keyword' },
                    following_count: { type: 'integer' },
                    // followers
                    follower_count: { type: 'integer' },
                    track_count: { type: 'integer' },
                    tracks: {
                        properties: {
                            mood: sharedIndexSettings_1.lowerKeyword,
                            genre: sharedIndexSettings_1.lowerKeyword,
                            tags: sharedIndexSettings_1.lowerKeyword,
                        },
                    },
                    allow_ai_attribution: { type: 'boolean' },
                },
            },
        };
        return _this;
    }
    UserIndexer.prototype.baseSelect = function () {
        return "\n    -- etl users\n    select \n      users.*,\n      coalesce(user_balances.balance, '0') as balance,\n      coalesce(user_balances.associated_wallets_balance, '0') as associated_wallets_balance,\n      coalesce(user_balances.waudio, '0') as waudio,\n      coalesce(user_balances.waudio, '0') as waudio_balance, -- do we need both waudio and waudio_balance\n      user_balances.associated_sol_wallets_balance,\n      user_bank_accounts.bank_account as spl_wallet,\n      coalesce(track_count, 0) as track_count,\n      coalesce(playlist_count, 0) as playlist_count,\n      coalesce(album_count, 0) as album_count,\n      coalesce(follower_count, 0) as follower_count,\n      coalesce(following_count, 0) as following_count,\n      coalesce(repost_count, 0) as repost_count,\n      coalesce(track_save_count, 0) as track_save_count,\n      coalesce(supporter_count, 0) as supporter_count,\n      coalesce(supporting_count, 0) as supporting_count\n    from\n      users\n      left join aggregate_user on users.user_id = aggregate_user.user_id\n      left join user_balances on users.user_id = user_balances.user_id\n      left join user_bank_accounts on users.wallet = user_bank_accounts.ethereum_address\n    where 1=1 \n    ";
    };
    UserIndexer.prototype.checkpointSql = function (checkpoint) {
        return "\n      and users.user_id in (\n        select user_id from users where blocknumber >= ".concat(checkpoint.users, "\n        union\n        select follower_user_id from follows where blocknumber >= ").concat(checkpoint.users, "\n        union\n        select followee_user_id from follows where blocknumber >= ").concat(checkpoint.users, "\n        union\n        select owner_id from tracks where blocknumber >= ").concat(checkpoint.tracks, "\n      )\n    ");
    };
    UserIndexer.prototype.withBatch = function (rows) {
        return __awaiter(this, void 0, void 0, function () {
            var userIds, _a, tracksByOwnerId, followMap, subscriptionsMap, _i, rows_1, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userIds = rows.map(function (r) { return r.user_id; });
                        return [4 /*yield*/, Promise.all([
                                this.userTracks(userIds),
                                this.userFollows(userIds),
                                this.userSubscriptions(userIds),
                            ])];
                    case 1:
                        _a = _b.sent(), tracksByOwnerId = _a[0], followMap = _a[1], subscriptionsMap = _a[2];
                        for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            user = rows_1[_i];
                            user.tracks = tracksByOwnerId[user.user_id] || [];
                            user.track_count = user.tracks.length;
                            user.following_ids = followMap[user.user_id] || [];
                            user.subscribed_ids = subscriptionsMap[user.user_id] || [];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UserIndexer.prototype.withRow = function (row) {
        row.suggest = [row.handle, row.name].filter(function (x) { return x; }).join(' ');
        row.following_count = row.following_ids.length;
    };
    UserIndexer.prototype.userFollows = function (userIds) {
        return __awaiter(this, void 0, void 0, function () {
            var idList, q, result, grouped, _i, _a, _b, user_id, follow_rows;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!userIds.length)
                            return [2 /*return*/, {}];
                        idList = Array.from(userIds).join(',');
                        q = "\n      select \n        follower_user_id,\n        followee_user_id \n      from follows\n      where is_delete = false\n        and follower_user_id in (".concat(idList, ")\n      order by created_at desc\n    ");
                        return [4 /*yield*/, (0, conn_1.dialPg)().query(q)];
                    case 1:
                        result = _c.sent();
                        grouped = (0, lodash_1.groupBy)(result.rows, 'follower_user_id');
                        for (_i = 0, _a = Object.entries(grouped); _i < _a.length; _i++) {
                            _b = _a[_i], user_id = _b[0], follow_rows = _b[1];
                            grouped[user_id] = follow_rows.map(function (r) { return r.followee_user_id; });
                        }
                        return [2 /*return*/, grouped];
                }
            });
        });
    };
    UserIndexer.prototype.userSubscriptions = function (userIds) {
        return __awaiter(this, void 0, void 0, function () {
            var idList, q, result, grouped, _i, _a, _b, subscriber_id, subscription_rows;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!userIds.length)
                            return [2 /*return*/, {}];
                        idList = Array.from(userIds).join(',');
                        q = "\n      select \n        subscriber_id,\n        user_id \n      from subscriptions\n      where is_delete = false\n        and subscriber_id in (".concat(idList, ")\n      order by created_at desc\n    ");
                        return [4 /*yield*/, (0, conn_1.dialPg)().query(q)];
                    case 1:
                        result = _c.sent();
                        grouped = (0, lodash_1.groupBy)(result.rows, 'subscriber_id');
                        for (_i = 0, _a = Object.entries(grouped); _i < _a.length; _i++) {
                            _b = _a[_i], subscriber_id = _b[0], subscription_rows = _b[1];
                            grouped[subscriber_id] = subscription_rows.map(function (r) { return r.user_id; });
                        }
                        return [2 /*return*/, grouped];
                }
            });
        });
    };
    UserIndexer.prototype.userTracks = function (userIds) {
        return __awaiter(this, void 0, void 0, function () {
            var pg, idList, q, allTracks, _i, _a, t, grouped;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!userIds.length)
                            return [2 /*return*/, {}];
                        pg = (0, conn_1.dialPg)();
                        idList = Array.from(userIds).join(',');
                        q = "\n      select \n        track_id, owner_id, genre, mood, tags, title, created_at\n      from tracks \n      where \n        is_current\n        and not is_delete \n        and not is_unlisted\n        and stem_of is null\n        and owner_id in (".concat(idList, ")\n      order by created_at desc\n    ");
                        return [4 /*yield*/, pg.query(q)];
                    case 1:
                        allTracks = _b.sent();
                        for (_i = 0, _a = allTracks.rows; _i < _a.length; _i++) {
                            t = _a[_i];
                            t.tags = (0, splitTags_1.splitTags)(t.tags);
                        }
                        grouped = (0, lodash_1.groupBy)(allTracks.rows, 'owner_id');
                        return [2 /*return*/, grouped];
                }
            });
        });
    };
    return UserIndexer;
}(BaseIndexer_1.BaseIndexer));
exports.UserIndexer = UserIndexer;
