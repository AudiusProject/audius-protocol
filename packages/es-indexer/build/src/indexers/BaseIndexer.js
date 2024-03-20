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
exports.BaseIndexer = void 0;
var lodash_1 = require("lodash");
var conn_1 = require("../conn");
var perf_hooks_1 = require("perf_hooks");
var logger_1 = require("../logger");
var indexNames_1 = require("../indexNames");
var BaseIndexer = /** @class */ (function () {
    function BaseIndexer(tableName, idColumn) {
        this.rowCounter = 0;
        this.batchSize = 1000;
        this.tableName = tableName;
        this.idColumn = idColumn;
        this.indexName = indexNames_1.indexNames[tableName];
        this.logger = logger_1.logger.child({
            index: this.indexName,
        });
        this.es = (0, conn_1.dialEs)();
    }
    BaseIndexer.prototype.baseSelect = function () {
        return "select * from ".concat(this.tableName, " where 1=1 ");
    };
    BaseIndexer.prototype.createIndex = function (_a) {
        var drop = _a.drop;
        return __awaiter(this, void 0, void 0, function () {
            var _b, es, mapping, logger, tableName;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = this, es = _b.es, mapping = _b.mapping, logger = _b.logger, tableName = _b.tableName;
                        if (!mapping)
                            throw new Error("".concat(tableName, " mapping is undefined"));
                        if (!drop) return [3 /*break*/, 3];
                        logger.info('dropping index: ' + mapping.index);
                        return [4 /*yield*/, es.indices.delete({ index: mapping.index }, { ignore: [404] })];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, es.indices.create(mapping)];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, es.indices.create(mapping, { ignore: [400] })];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.refreshIndex = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, es, logger, indexName;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, es = _a.es, logger = _a.logger, indexName = _a.indexName;
                        logger.info('refreshing index: ' + indexName);
                        return [4 /*yield*/, es.indices.refresh({ index: indexName })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.cutoverAlias = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, es, logger, indexName, tableName, existingAlias, mappedTo;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = this, es = _b.es, logger = _b.logger, indexName = _b.indexName, tableName = _b.tableName;
                        return [4 /*yield*/, es.cat.aliases({
                                name: tableName,
                                format: 'json',
                            })];
                    case 1:
                        existingAlias = _c.sent();
                        mappedTo = (_a = existingAlias[0]) === null || _a === void 0 ? void 0 : _a.index;
                        if (!!mappedTo) return [3 /*break*/, 3];
                        logger.info({
                            action: 'adding index',
                        });
                        return [4 /*yield*/, es.indices.putAlias({
                                index: this.indexName,
                                name: this.tableName,
                            })];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!(mappedTo !== indexName)) return [3 /*break*/, 5];
                        logger.info({
                            action: 'cutting over index',
                            alias: tableName,
                            from: mappedTo,
                            to: indexName,
                        });
                        return [4 /*yield*/, es.indices.updateAliases({
                                actions: [
                                    {
                                        remove: {
                                            alias: tableName,
                                            index: mappedTo,
                                        },
                                    },
                                    {
                                        add: {
                                            alias: tableName,
                                            index: indexName,
                                        },
                                    },
                                ],
                            })];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        logger.info({
                            actions: 'noop',
                            alias: tableName,
                            index: indexName,
                        });
                        _c.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.cleanupOldIndices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, es, logger, indexName, tableName, indices, old, _i, old_1, index, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, es = _a.es, logger = _a.logger, indexName = _a.indexName, tableName = _a.tableName;
                        return [4 /*yield*/, es.cat.indices({ format: 'json' })];
                    case 1:
                        indices = _b.sent();
                        old = indices.filter(function (i) { return i.index.startsWith(tableName) && i.index != indexName; });
                        _i = 0, old_1 = old;
                        _b.label = 2;
                    case 2:
                        if (!(_i < old_1.length)) return [3 /*break*/, 7];
                        index = old_1[_i].index;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, es.indices.delete({ index: index })];
                    case 4:
                        _b.sent();
                        logger.info("dropped old index: ".concat(index));
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _b.sent();
                        logger.error(e_1, "failed to drop old index: ".concat(index));
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.indexIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ids.length)
                            return [2 /*return*/];
                        sql = this.baseSelect();
                        sql += " and ".concat(this.tableName, ".").concat(this.idColumn, " in (").concat(ids.join(','), ") ");
                        return [4 /*yield*/, (0, conn_1.dialPg)().query(sql)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.indexRows(result.rows)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.catchup = function (checkpoint) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, _a, client, cursor, batchSize, rows;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sql = this.baseSelect();
                        if (checkpoint) {
                            sql += this.checkpointSql(checkpoint);
                        }
                        sql += " order by blocknumber asc ";
                        return [4 /*yield*/, (0, conn_1.queryCursor)(sql)];
                    case 1:
                        _a = _b.sent(), client = _a.client, cursor = _a.cursor;
                        batchSize = this.batchSize;
                        _b.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 5];
                        return [4 /*yield*/, cursor.read(batchSize)];
                    case 3:
                        rows = _b.sent();
                        if (rows.length == 0)
                            return [3 /*break*/, 5];
                        return [4 /*yield*/, this.indexRows(rows)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, cursor.close()];
                    case 6:
                        _b.sent();
                        client.release();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.indexRows = function (rows) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, es, logger, took, before, chunks, _loop_1, this_1, _i, chunks_1, chunk_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!rows.length)
                            return [2 /*return*/];
                        _a = this, es = _a.es, logger = _a.logger;
                        took = {};
                        before = perf_hooks_1.performance.now();
                        return [4 /*yield*/, this.withBatch(rows)];
                    case 1:
                        _b.sent();
                        took.withBatch = perf_hooks_1.performance.now() - before;
                        // with row
                        rows.forEach(function (r) { return _this.withRow(r); });
                        chunks = (0, lodash_1.chunk)(rows, this.batchSize);
                        _loop_1 = function (chunk_1) {
                            var body, attempt, got;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        body = this_1.buildIndexOps(chunk_1);
                                        attempt = 1;
                                        attempt = 1;
                                        _c.label = 1;
                                    case 1:
                                        if (!(attempt < 10)) return [3 /*break*/, 6];
                                        return [4 /*yield*/, es.bulk({ body: body })];
                                    case 2:
                                        got = _c.sent();
                                        if (!got.errors) return [3 /*break*/, 4];
                                        logger.error(got.items[0], "bulk indexing error.  Attempt #".concat(attempt));
                                        // linear backoff 5s increments
                                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 5000 * attempt); })];
                                    case 3:
                                        // linear backoff 5s increments
                                        _c.sent();
                                        return [3 /*break*/, 5];
                                    case 4: return [3 /*break*/, 6];
                                    case 5:
                                        attempt++;
                                        return [3 /*break*/, 1];
                                    case 6:
                                        this_1.rowCounter += chunk_1.length;
                                        logger.info({
                                            updates: chunk_1.length,
                                            attempts: attempt,
                                            withBatchMs: took.withBatch.toFixed(0),
                                            lifetime: this_1.rowCounter,
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, chunks_1 = chunks;
                        _b.label = 2;
                    case 2:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 5];
                        chunk_1 = chunks_1[_i];
                        return [5 /*yield**/, _loop_1(chunk_1)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BaseIndexer.prototype.buildIndexOps = function (rows) {
        var _this = this;
        return rows.flatMap(function (row) { return [
            { index: { _id: row[_this.idColumn], _index: _this.indexName } },
            row,
        ]; });
    };
    BaseIndexer.prototype.withBatch = function (rows) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseIndexer.prototype.withRow = function (row) { };
    return BaseIndexer;
}());
exports.BaseIndexer = BaseIndexer;
