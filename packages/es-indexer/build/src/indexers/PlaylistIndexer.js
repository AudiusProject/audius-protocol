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
exports.PlaylistIndexer = void 0;
var lodash_1 = require("lodash");
var conn_1 = require("../conn");
var splitTags_1 = require("../helpers/splitTags");
var indexNames_1 = require("../indexNames");
var BaseIndexer_1 = require("./BaseIndexer");
var sharedIndexSettings_1 = require("./sharedIndexSettings");
var PlaylistIndexer = /** @class */ (function (_super) {
    __extends(PlaylistIndexer, _super);
    function PlaylistIndexer() {
        var _this = _super.call(this, 'playlists', 'playlist_id') || this;
        _this.mapping = {
            index: indexNames_1.indexNames.playlists,
            settings: (0, lodash_1.merge)(sharedIndexSettings_1.sharedIndexSettings, {}),
            mappings: {
                dynamic: false,
                properties: {
                    blocknumber: { type: 'integer' },
                    playlist_owner_id: { type: 'keyword' },
                    created_at: { type: 'date' },
                    updated_at: { type: 'date' },
                    is_album: { type: 'boolean' },
                    is_private: { type: 'boolean' },
                    permalink: sharedIndexSettings_1.lowerKeyword,
                    is_delete: { type: 'boolean' },
                    routes: sharedIndexSettings_1.lowerKeyword,
                    suggest: sharedIndexSettings_1.standardSuggest,
                    playlist_name: __assign(__assign({}, sharedIndexSettings_1.lowerKeyword), { fields: {
                            searchable: sharedIndexSettings_1.standardText,
                        } }),
                    'playlist_contents.track_ids.track': { type: 'keyword' },
                    user: {
                        properties: {
                            handle: __assign(__assign({}, sharedIndexSettings_1.noWhitespaceLowerKeyword), { fields: {
                                    searchable: sharedIndexSettings_1.standardText,
                                } }),
                            name: __assign(__assign({}, sharedIndexSettings_1.lowerKeyword), { fields: {
                                    searchable: sharedIndexSettings_1.standardText,
                                } }),
                            location: sharedIndexSettings_1.lowerKeyword,
                            follower_count: { type: 'integer' },
                            is_verified: { type: 'boolean' },
                            created_at: { type: 'date' },
                            updated_at: { type: 'date' },
                        },
                    },
                    // saves
                    saved_by: { type: 'keyword' },
                    save_count: { type: 'integer' },
                    // reposts
                    reposted_by: { type: 'keyword' },
                    repost_count: { type: 'integer' },
                    dominant_mood: sharedIndexSettings_1.lowerKeyword,
                    tracks: {
                        properties: {
                            mood: sharedIndexSettings_1.lowerKeyword,
                            genre: sharedIndexSettings_1.lowerKeyword,
                            tags: sharedIndexSettings_1.lowerKeyword,
                            play_count: { type: 'integer' },
                            repost_count: { type: 'integer' },
                            save_count: { type: 'integer' },
                        },
                    },
                    is_image_autogenerated: { type: 'boolean' },
                },
            },
        };
        return _this;
    }
    PlaylistIndexer.prototype.baseSelect = function () {
        return "\n      -- etl playlists\n      select \n        playlists.*,\n\n        json_build_object(\n          'handle', users.handle,\n          'name', users.name,\n          'location', users.location,\n          'follower_count', follower_count,\n          'is_verified', users.is_verified,\n          'created_at', users.created_at,\n          'updated_at', users.updated_at\n        ) as user,\n\n        array(\n          select slug\n          from playlist_routes pr\n          where\n            pr.playlist_id = playlists.playlist_id\n          order by is_current\n        ) as routes,\n\n        array(\n          select user_id \n          from reposts\n          where\n            is_delete = false\n            and repost_type != 'track'::reposttype\n            and repost_item_id = playlist_id\n            order by created_at desc\n        ) as reposted_by,\n      \n        array(\n          select user_id \n          from saves\n          where\n            is_delete = false\n            and save_type != 'track'::savetype\n            and save_item_id = playlist_id\n            order by created_at desc\n        ) as saved_by\n\n      from playlists \n      join users on playlist_owner_id = user_id\n      left join aggregate_user on users.user_id = aggregate_user.user_id\n      where 1=1 \n    ";
    };
    PlaylistIndexer.prototype.checkpointSql = function (checkpoint) {
        // really we should mark playlist stale if any of the playlist tracks changes
        // but don't know how to do the sql for that... so the low tech solution would be to re-do playlists from scratch
        // which might actually be faster, since it's a very small collection
        // in which case we could just delete this function
        // track play_count will also go stale (same problem as above)
        return "\n      and playlist_id in (\n        select playlist_id from playlists where blocknumber >= ".concat(checkpoint.playlists, "\n        union\n        select save_item_id from saves where save_type in ('playlist', 'album') and blocknumber >= ").concat(checkpoint.saves, "\n        union\n        select repost_item_id from reposts where repost_type in ('playlist', 'album') and blocknumber >= ").concat(checkpoint.reposts, "\n      )");
    };
    PlaylistIndexer.prototype.withBatch = function (rows) {
        return __awaiter(this, void 0, void 0, function () {
            var trackIds, _i, rows_1, row, tracksById, _a, rows_2, playlist;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        trackIds = new Set();
                        for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            row = rows_1[_i];
                            row.playlist_contents.track_ids
                                .map(function (t) { return t.track; })
                                .filter(Boolean)
                                .forEach(function (t) { return trackIds.add(t); });
                        }
                        return [4 /*yield*/, this.getTracks(Array.from(trackIds))
                            // pull track data onto playlist
                        ];
                    case 1:
                        tracksById = _b.sent();
                        // pull track data onto playlist
                        for (_a = 0, rows_2 = rows; _a < rows_2.length; _a++) {
                            playlist = rows_2[_a];
                            playlist.tracks = playlist.playlist_contents.track_ids
                                .map(function (t) { return tracksById[t.track]; })
                                .filter(Boolean);
                            // determine most common mood
                            playlist.dominant_mood = (0, lodash_1.flow)(lodash_1.compact, lodash_1.countBy, lodash_1.entries, (0, lodash_1.partialRight)(lodash_1.maxBy, lodash_1.last), lodash_1.head)(playlist.tracks.map(function (t) { return t.mood; }));
                            playlist.total_play_count = playlist.tracks.reduce(function (acc, s) { return acc + parseInt(s.play_count); }, 0);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PlaylistIndexer.prototype.withRow = function (row) {
        row.suggest = [row.playlist_name, row.user.handle, row.user.name]
            .filter(function (x) { return x; })
            .join(' ');
        row.repost_count = row.reposted_by.length;
        row.save_count = row.saved_by.length;
        var slug = row.routes[row.routes.length - 1];
        var collectionType = row.is_album ? 'album' : 'playlist';
        row.permalink = "/".concat(row.user.handle, "/").concat(collectionType, "/").concat(slug);
    };
    PlaylistIndexer.prototype.getTracks = function (trackIds) {
        return __awaiter(this, void 0, void 0, function () {
            var pg, idList, q, allTracks, _i, _a, t;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!trackIds.length)
                            return [2 /*return*/, {}];
                        pg = (0, conn_1.dialPg)();
                        idList = Array.from(trackIds).join(',');
                        q = "\n      select \n        track_id,\n        genre,\n        mood,\n        tags,\n        title,\n        created_at,\n        coalesce(aggregate_track.repost_count, 0) as repost_count,\n        coalesce(aggregate_track.save_count, 0) as save_count,\n        coalesce(aggregate_plays.count, 0) as play_count\n  \n      from tracks\n      left join aggregate_track using (track_id)\n      left join aggregate_plays on tracks.track_id = aggregate_plays.play_item_id\n      where \n        is_delete = false\n        and is_unlisted = false\n        and track_id in (".concat(idList, ")");
                        return [4 /*yield*/, pg.query(q)];
                    case 1:
                        allTracks = _b.sent();
                        for (_i = 0, _a = allTracks.rows; _i < _a.length; _i++) {
                            t = _a[_i];
                            t.tags = (0, splitTags_1.splitTags)(t.tags);
                        }
                        return [2 /*return*/, (0, lodash_1.keyBy)(allTracks.rows, 'track_id')];
                }
            });
        });
    };
    return PlaylistIndexer;
}(BaseIndexer_1.BaseIndexer));
exports.PlaylistIndexer = PlaylistIndexer;
