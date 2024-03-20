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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepostIndexer = void 0;
var lodash_1 = require("lodash");
var indexNames_1 = require("../indexNames");
var BaseIndexer_1 = require("./BaseIndexer");
var sharedIndexSettings_1 = require("./sharedIndexSettings");
var RepostIndexer = /** @class */ (function (_super) {
    __extends(RepostIndexer, _super);
    function RepostIndexer() {
        var _this = _super.call(this, 'reposts', 'repost_id') || this;
        _this.mapping = {
            index: indexNames_1.indexNames.reposts,
            settings: (0, lodash_1.merge)(sharedIndexSettings_1.sharedIndexSettings, {}),
            mappings: {
                dynamic: false,
                properties: {
                    blocknumber: { type: 'integer' },
                    item_key: { type: 'keyword' },
                    repost_type: { type: 'keyword' },
                    repost_item_id: { type: 'keyword' },
                    is_delete: { type: 'boolean' },
                    user_id: { type: 'keyword' },
                    created_at: { type: 'date' },
                },
            },
        };
        _this.batchSize = 20000;
        return _this;
    }
    RepostIndexer.prototype.checkpointSql = function (checkpoint) {
        return " and blocknumber >= ".concat(checkpoint.reposts, " ");
    };
    RepostIndexer.prototype.withRow = function (row) {
        row.item_key = "".concat(row.repost_type, ":").concat(row.repost_item_id);
        row.repost_id = "".concat(row.user_id, ":").concat(row.item_key);
    };
    return RepostIndexer;
}(BaseIndexer_1.BaseIndexer));
exports.RepostIndexer = RepostIndexer;
