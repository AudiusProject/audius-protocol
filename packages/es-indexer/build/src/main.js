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
exports.indexer = void 0;
var PlaylistIndexer_1 = require("./indexers/PlaylistIndexer");
var RepostIndexer_1 = require("./indexers/RepostIndexer");
var SaveIndexer_1 = require("./indexers/SaveIndexer");
var TrackIndexer_1 = require("./indexers/TrackIndexer");
var UserIndexer_1 = require("./indexers/UserIndexer");
var listener_1 = require("./listener");
var logger_1 = require("./logger");
var conn_1 = require("./conn");
var commander_1 = require("commander");
exports.indexer = {
    playlists: new PlaylistIndexer_1.PlaylistIndexer(),
    reposts: new RepostIndexer_1.RepostIndexer(),
    saves: new SaveIndexer_1.SaveIndexer(),
    tracks: new TrackIndexer_1.TrackIndexer(),
    users: new UserIndexer_1.UserIndexer(),
};
function processPending(pending) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all([
                    exports.indexer.playlists.indexIds(Array.from(pending.playlistIds)),
                    exports.indexer.tracks.indexIds(Array.from(pending.trackIds)),
                    exports.indexer.users.indexIds(Array.from(pending.userIds)),
                    exports.indexer.reposts.indexRows(pending.reposts),
                    exports.indexer.saves.indexRows(pending.saves),
                ])];
        });
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var cliFlags, health, indexers, checkpoints, pending_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cliFlags = commander_1.program
                        .option('--no-listen', 'exit after catchup is complete')
                        .option('--drop', 'drop and recreate indexes')
                        .parse()
                        .opts();
                    logger_1.logger.info(cliFlags, 'booting');
                    return [4 /*yield*/, (0, conn_1.recoverFromRedIndex)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, conn_1.waitForHealthyCluster)()];
                case 2:
                    health = _a.sent();
                    return [4 /*yield*/, (0, conn_1.ensureSaneCluterSettings)()];
                case 3:
                    _a.sent();
                    logger_1.logger.info("starting: health ".concat(health.status));
                    indexers = Object.values(exports.indexer);
                    return [4 /*yield*/, Promise.all(indexers.map(function (ix) { return ix.createIndex({ drop: cliFlags.drop }); }))
                        // setup postgres trigger + listeners
                    ];
                case 4:
                    _a.sent();
                    // setup postgres trigger + listeners
                    return [4 /*yield*/, (0, listener_1.startListener)()
                        // backfill since last run
                    ];
                case 5:
                    // setup postgres trigger + listeners
                    _a.sent();
                    return [4 /*yield*/, (0, conn_1.getBlocknumberCheckpoints)()];
                case 6:
                    checkpoints = _a.sent();
                    logger_1.logger.info(checkpoints, 'catchup from blocknumbers');
                    return [4 /*yield*/, Promise.all(Object.values(exports.indexer).map(function (i) { return i.catchup(checkpoints); }))
                        // refresh indexes before cutting over
                    ];
                case 7:
                    _a.sent();
                    // refresh indexes before cutting over
                    logger_1.logger.info(checkpoints, 'refreshing indexes');
                    return [4 /*yield*/, Promise.all(Object.values(exports.indexer).map(function (i) { return i.refreshIndex(); }))
                        // cutover aliases
                    ];
                case 8:
                    _a.sent();
                    // cutover aliases
                    logger_1.logger.info('catchup done... cutting over aliases');
                    return [4 /*yield*/, Promise.all(indexers.map(function (ix) { return ix.cutoverAlias(); }))
                        // drop old indices
                    ];
                case 9:
                    _a.sent();
                    // drop old indices
                    logger_1.logger.info('alias cutover done... dropping any old indices');
                    return [4 /*yield*/, Promise.all(indexers.map(function (ix) { return ix.cleanupOldIndices(); }))];
                case 10:
                    _a.sent();
                    if (!cliFlags.listen) {
                        logger_1.logger.info('--no-listen: exiting');
                        process.exit(0);
                    }
                    // process events
                    logger_1.logger.info('processing events');
                    _a.label = 11;
                case 11:
                    if (!true) return [3 /*break*/, 15];
                    pending_1 = (0, listener_1.takePending)();
                    if (!pending_1) return [3 /*break*/, 13];
                    return [4 /*yield*/, processPending(pending_1)];
                case 12:
                    _a.sent();
                    logger_1.logger.info('processed new updates');
                    _a.label = 13;
                case 13: 
                // free up event loop + batch queries to postgres
                return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 500); })];
                case 14:
                    // free up event loop + batch queries to postgres
                    _a.sent();
                    return [3 /*break*/, 11];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, start()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    logger_1.logger.fatal(e_1, 'save me pm2');
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
main();
process
    .on('unhandledRejection', function (reason, promise) {
    logger_1.logger.error({ reason: reason, promise: promise }, 'unhandledRejection');
})
    .on('uncaughtException', function (err) {
    logger_1.logger.fatal(err, 'uncaughtException');
    process.exit(1);
});
