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
exports.SaveIndexer = void 0;
var lodash_1 = require("lodash");
var indexNames_1 = require("../indexNames");
var BaseIndexer_1 = require("./BaseIndexer");
var sharedIndexSettings_1 = require("./sharedIndexSettings");
var SaveIndexer = /** @class */ (function (_super) {
    __extends(SaveIndexer, _super);
    function SaveIndexer() {
        var _this = _super.call(this, 'saves', 'save_id') || this;
        _this.mapping = {
            index: indexNames_1.indexNames.saves,
            settings: (0, lodash_1.merge)(sharedIndexSettings_1.sharedIndexSettings, {}),
            mappings: {
                dynamic: false,
                properties: {
                    blocknumber: { type: 'integer' },
                    user_id: { type: 'keyword' },
                    item_key: { type: 'keyword' },
                    save_type: { type: 'keyword' },
                    save_item_id: { type: 'keyword' },
                    is_delete: { type: 'boolean' },
                    created_at: { type: 'date' },
                },
            },
        };
        _this.batchSize = 20000;
        return _this;
    }
    SaveIndexer.prototype.checkpointSql = function (checkpoint) {
        return " and blocknumber >= ".concat(checkpoint.saves, " ");
    };
    SaveIndexer.prototype.withRow = function (row) {
        row.item_key = "".concat(row.save_type, ":").concat(row.save_item_id);
        row.save_id = "".concat(row.user_id, ":").concat(row.item_key);
    };
    return SaveIndexer;
}(BaseIndexer_1.BaseIndexer));
exports.SaveIndexer = SaveIndexer;
