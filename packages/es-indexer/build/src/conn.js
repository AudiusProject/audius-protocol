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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlocknumberCheckpoints = exports.ensureSaneCluterSettings = exports.waitForHealthyCluster = exports.recoverFromRedIndex = exports.dialEs = exports.queryCursor = exports.dialPg = void 0;
var pg_1 = require("pg");
var elasticsearch_1 = require("@elastic/elasticsearch");
var pg_cursor_1 = __importDefault(require("pg-cursor"));
var lodash_1 = __importDefault(require("lodash"));
var indexNames_1 = require("./indexNames");
var logger_1 = require("./logger");
// we want numbers as floats instead of strings.
// no worries about precision.
// https://github.com/brianc/node-postgres/issues/811#issuecomment-1500255173
// 20 = INT8 (64 bit int)
pg_1.types.setTypeParser(20, function (value) { return parseFloat(value); });
var pool = undefined;
function dialPg() {
    if (!pool) {
        var connectionString = process.env.audius_db_url;
        pool = new pg_1.Pool({ connectionString: connectionString, application_name: 'es-indexer', types: pg_1.types });
    }
    return pool;
}
exports.dialPg = dialPg;
function queryCursor(sql) {
    return __awaiter(this, void 0, void 0, function () {
        var client, cursor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dialPg().connect()];
                case 1:
                    client = _a.sent();
                    cursor = client.query(new pg_cursor_1.default(sql));
                    return [2 /*return*/, { client: client, cursor: cursor }];
            }
        });
    });
}
exports.queryCursor = queryCursor;
var esc = undefined;
function dialEs() {
    if (!esc) {
        var url = process.env.audius_elasticsearch_url;
        esc = new elasticsearch_1.Client({ node: url });
    }
    return esc;
}
exports.dialEs = dialEs;
function recoverFromRedIndex() {
    return __awaiter(this, void 0, void 0, function () {
        var es, redIndices, i, indices, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    es = dialEs();
                    redIndices = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 10)) return [3 /*break*/, 5];
                    return [4 /*yield*/, es.cat.indices({ format: 'json' })];
                case 2:
                    indices = _a.sent();
                    redIndices = indices.filter(function (i) { return i.health == 'red'; });
                    // no red indices... all good!
                    if (redIndices.length == 0) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 5000); })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, Promise.all(redIndices.map(function (idx) {
                            logger_1.logger.warn('nuking red index ' + idx.index);
                            return es.indices.delete({ index: idx.index }, { ignore: [404] });
                        }))];
                case 6:
                    _a.sent();
                    logger_1.logger.info('nuke worked');
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    logger_1.logger.error(e_1, 'nuke failed');
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.recoverFromRedIndex = recoverFromRedIndex;
function waitForHealthyCluster() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, dialEs().cluster.health({
                    wait_for_status: 'green',
                    timeout: '60s',
                }, {
                    requestTimeout: '60s',
                })];
        });
    });
}
exports.waitForHealthyCluster = waitForHealthyCluster;
function ensureSaneCluterSettings() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, dialEs().cluster.putSettings({
                    persistent: {
                        'action.auto_create_index': false,
                    },
                })];
        });
    });
}
exports.ensureSaneCluterSettings = ensureSaneCluterSettings;
/**
 * Gets the max(blocknumber) from elasticsearch indexes
 * Used for incremental indexing to understand "where we were" so we can load new data from postgres
 */
function getBlocknumberCheckpoints() {
    return __awaiter(this, void 0, void 0, function () {
        var searches, _i, _a, _b, tableName, indexName, multi, values, tableNames, checkpoints;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    searches = [];
                    for (_i = 0, _a = Object.entries(indexNames_1.indexNames); _i < _a.length; _i++) {
                        _b = _a[_i], tableName = _b[0], indexName = _b[1];
                        searches.push({ index: indexName });
                        searches.push({
                            size: 0,
                            aggs: {
                                max_blocknumber: {
                                    max: {
                                        field: checkpointField(tableName),
                                    },
                                },
                            },
                        });
                    }
                    return [4 /*yield*/, dialEs().msearch({ searches: searches })];
                case 1:
                    multi = _c.sent();
                    values = multi.responses.map(function (r) { var _a, _b; return ((_b = (_a = r.aggregations) === null || _a === void 0 ? void 0 : _a.max_blocknumber) === null || _b === void 0 ? void 0 : _b.value) || 0; });
                    tableNames = Object.keys(indexNames_1.indexNames);
                    checkpoints = lodash_1.default.zipObject(tableNames, values);
                    return [2 /*return*/, checkpoints];
            }
        });
    });
}
exports.getBlocknumberCheckpoints = getBlocknumberCheckpoints;
function checkpointField(tableName) {
    switch (tableName) {
        case 'plays':
            return 'created_at';
        default:
            return 'blocknumber';
    }
}
