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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackIndexer = void 0;
var lodash_1 = require("lodash");
var splitTags_1 = require("../helpers/splitTags");
var indexNames_1 = require("../indexNames");
var BaseIndexer_1 = require("./BaseIndexer");
var sharedIndexSettings_1 = require("./sharedIndexSettings");
var TrackIndexer = /** @class */ (function (_super) {
    __extends(TrackIndexer, _super);
    function TrackIndexer() {
        var _this = _super.call(this, 'tracks', 'track_id') || this;
        _this.mapping = {
            index: indexNames_1.indexNames.tracks,
            settings: (0, lodash_1.merge)(sharedIndexSettings_1.sharedIndexSettings, {}),
            mappings: {
                dynamic: false,
                properties: {
                    blocknumber: { type: 'integer' },
                    owner_id: { type: 'keyword' },
                    created_at: { type: 'date' },
                    updated_at: { type: 'date' },
                    permalink: { type: 'keyword' },
                    route_id: { type: 'keyword' },
                    routes: { type: 'keyword' },
                    title: __assign(__assign({}, sharedIndexSettings_1.lowerKeyword), { fields: {
                            searchable: sharedIndexSettings_1.standardText,
                        } }),
                    tag_list: sharedIndexSettings_1.lowerKeyword,
                    genre: { type: 'keyword' },
                    mood: { type: 'keyword' },
                    is_delete: { type: 'boolean' },
                    is_unlisted: { type: 'boolean' },
                    downloadable: { type: 'boolean' },
                    purchaseable: { type: 'boolean' },
                    // saves
                    saved_by: { type: 'keyword' },
                    save_count: { type: 'integer' },
                    // reposts
                    reposted_by: { type: 'keyword' },
                    repost_count: { type: 'integer' },
                    suggest: sharedIndexSettings_1.standardSuggest,
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
                    stem_of: {
                        properties: {
                            category: { type: 'keyword' },
                            parent_track_id: { type: 'keyword' },
                        },
                    },
                    'remix_of.tracks.parent_track_id': { type: 'keyword' },
                    ai_attribution_user_id: { type: 'integer' },
                },
            },
        };
        _this.batchSize = 500;
        return _this;
    }
    TrackIndexer.prototype.baseSelect = function () {
        return "\n    -- etl tracks\n    select \n      tracks.*,\n      case when tracks.stream_conditions->>'usdc_purchase'\n        is not null then true\n        else false\n      end as purchaseable,\n      tracks.is_downloadable as downloadable,\n      coalesce(aggregate_plays.count, 0) as play_count,\n  \n      json_build_object(\n        'handle', users.handle,\n        'name', users.name,\n        'location', users.location,\n        'follower_count', follower_count,\n        'is_verified', users.is_verified,\n        'created_at', users.created_at,\n        'updated_at', users.updated_at\n      ) as user,\n\n      array(\n        select slug \n        from track_routes r\n        where\n          r.track_id = tracks.track_id\n        order by is_current\n      ) as routes,\n  \n      array(\n        select user_id \n        from reposts\n        where\n          is_delete = false\n          and repost_type = 'track' \n          and repost_item_id = track_id\n        order by created_at desc\n      ) as reposted_by,\n    \n      array(\n        select user_id \n        from saves\n        where\n          is_delete = false\n          and save_type = 'track' \n          and save_item_id = track_id\n        order by created_at desc\n      ) as saved_by\n    \n    from tracks\n      join users on owner_id = user_id \n      left join aggregate_user on users.user_id = aggregate_user.user_id\n      left join aggregate_plays on tracks.track_id = aggregate_plays.play_item_id\n    WHERE 1=1 \n    ";
    };
    TrackIndexer.prototype.checkpointSql = function (checkpoint) {
        return "\n    and track_id in (\n      select track_id from tracks where blocknumber >= ".concat(checkpoint.tracks, "\n      union\n      select save_item_id from saves where save_type = 'track' and blocknumber >= ").concat(checkpoint.saves, "\n      union\n      select repost_item_id from reposts where repost_type = 'track' and blocknumber >= ").concat(checkpoint.reposts, "\n      union\n      select play_item_id FROM plays WHERE created_at > NOW() - INTERVAL '10 minutes'\n    )\n    ");
    };
    TrackIndexer.prototype.withRow = function (row) {
        row.suggest = [row.title, row.user.handle, row.user.name]
            .filter(function (x) { return x; })
            .join(' ');
        row.tag_list = (0, splitTags_1.splitTags)(row.tags);
        row.repost_count = row.reposted_by.length;
        row.favorite_count = row.saved_by.length;
        // get_feed_es uses `created_at` for tracks + playlists + reposts to sequence events
        // and has additional logic to compute the "earliest" created_at for an item
        // that can be either a track or a repost.
        //
        // while it would be possible to go adjust all this logic to conditionally use release_date for tracks
        // it's much easier to set the `created_at` to be `release_date` for tracks.
        //
        // my hope is to revisit the action_log concept which will simplify this complex feed logic.
        row.created_at = row.release_date || row.created_at;
        // permalink
        var currentRoute = row.routes[row.routes.length - 1];
        row.permalink = "/".concat(row.user.handle, "/").concat(currentRoute);
    };
    return TrackIndexer;
}(BaseIndexer_1.BaseIndexer));
exports.TrackIndexer = TrackIndexer;
