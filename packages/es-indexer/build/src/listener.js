"use strict";
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
exports.startListener = exports.takePending = exports.PendingUpdates = exports.LISTEN_TABLES = void 0;
var pg_1 = require("pg");
var logger_1 = require("./logger");
exports.LISTEN_TABLES = [
    'aggregate_plays',
    'aggregate_user',
    'follows',
    'playlists',
    'reposts',
    'saves',
    'tracks',
    'users',
];
var PendingUpdates = /** @class */ (function () {
    function PendingUpdates() {
        this.userIds = new Set();
        this.trackIds = new Set();
        this.playlistIds = new Set();
        this.reposts = [];
        this.saves = [];
        this.follows = [];
    }
    PendingUpdates.prototype.isEmpty = function () {
        return (this.reposts.length +
            this.saves.length +
            this.follows.length +
            this.userIds.size +
            this.trackIds.size +
            this.playlistIds.size ==
            0);
    };
    return PendingUpdates;
}());
exports.PendingUpdates = PendingUpdates;
var pending = new PendingUpdates();
function takePending() {
    if (pending.isEmpty())
        return;
    var p = pending;
    pending = new PendingUpdates();
    return p;
}
exports.takePending = takePending;
var handlers = {
    aggregate_user: function (row) {
        pending.userIds.add(row.user_id);
    },
    aggregate_plays: function (row) {
        if (!row.play_item_id)
            return; // when could this happen?
        pending.trackIds.add(row.play_item_id);
    },
    // TODO: can we do trigger on agg playlist matview?
    saves: function (save) {
        pending.saves.push(save);
        if (save.save_type == 'track') {
            pending.trackIds.add(save.save_item_id);
        }
        else {
            pending.playlistIds.add(save.save_item_id);
        }
    },
    reposts: function (repost) {
        pending.reposts.push(repost);
        if (repost.repost_type == 'track') {
            pending.trackIds.add(repost.repost_item_id);
        }
        else {
            pending.playlistIds.add(repost.repost_item_id);
        }
    },
    follows: function (follow) {
        pending.follows.push(follow);
        // followee follower_count comes from aggregate_user
        // which is update async...
        // marking followee_user_id stale here is likely to result in a noop
        // as aggregate_user hasn't been updated yet...
        // so instead we listen for update on that table to ensure follower_count gets updated.
        // pending.userIds.add(follow.followee_user_id)
        pending.userIds.add(follow.follower_user_id);
    },
    users: function (user) {
        pending.userIds.add(user.user_id);
    },
    tracks: function (track) {
        pending.trackIds.add(track.track_id);
    },
    playlists: function (playlist) {
        pending.playlistIds.add(playlist.playlist_id);
    },
};
function startListener() {
    return __awaiter(this, void 0, void 0, function () {
        var connectionString, client, tables, sql;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectionString = process.env.audius_db_url;
                    client = new pg_1.Client({ connectionString: connectionString, application_name: 'es-listen' });
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    tables = exports.LISTEN_TABLES;
                    sql = tables.map(function (t) { return "LISTEN ".concat(t, "; "); }).join(' ');
                    client.on('notification', function (msg) {
                        var body = JSON.parse(msg.payload);
                        var handler = handlers[msg.channel];
                        if (handler) {
                            handler(body);
                        }
                        else {
                            logger_1.logger.warn("no handler for ".concat(msg.channel));
                        }
                    });
                    return [4 /*yield*/, client.query(sql)];
                case 2:
                    _a.sent();
                    logger_1.logger.info({ tables: tables }, 'LISTEN');
                    return [2 /*return*/];
            }
        });
    });
}
exports.startListener = startListener;
