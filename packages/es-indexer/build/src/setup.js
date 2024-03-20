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
exports.setupTriggers = exports.LISTEN_TABLES = void 0;
var conn_1 = require("./conn");
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
var functionName = "on_new_row";
var trigger = "\ncreate or replace function ".concat(functionName, "() returns trigger as $$\nbegin\n  case TG_TABLE_NAME\n    when 'tracks' then\n      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('track_id', new.track_id)::text);\n    when 'users' then\n      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('user_id', new.user_id)::text);\n    when 'playlists' then\n      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('playlist_id', new.playlist_id)::text);\n    else\n      PERFORM pg_notify(TG_TABLE_NAME, to_json(new)::text);\n  end case;\n  return null;\nend; \n$$ language plpgsql;\n");
function setupTriggers() {
    return __awaiter(this, void 0, void 0, function () {
        var client, tables, count, skip;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, conn_1.dialPg)().connect()];
                case 1:
                    client = _a.sent();
                    tables = exports.LISTEN_TABLES;
                    return [4 /*yield*/, client.query("\n    SELECT count(*)\n    FROM information_schema.routines\n    WHERE routine_name = '".concat(functionName, "';"))];
                case 2:
                    count = _a.sent();
                    skip = count.rows[0].count == 1;
                    if (!skip) return [3 /*break*/, 3];
                    // quick fix to re-enable the incorrectly disabled trigger
                    client.query("alter table tracks enable trigger trg_tracks;");
                    logger_1.logger.info("function ".concat(functionName, " already exists... skipping"));
                    return [3 /*break*/, 7];
                case 3:
                    // drop existing triggers
                    logger_1.logger.info({ tables: tables }, "dropping any existing triggers");
                    return [4 /*yield*/, Promise.all(tables.map(function (t) {
                            return client.query("drop trigger if exists trg_".concat(t, " on ").concat(t, ";"));
                        }))
                        // create function
                    ];
                case 4:
                    _a.sent();
                    // create function
                    logger_1.logger.info("creating plpgsql function");
                    return [4 /*yield*/, client.query(trigger)
                        // create triggers
                    ];
                case 5:
                    _a.sent();
                    // create triggers
                    logger_1.logger.info({ tables: tables }, "creating triggers");
                    if (!(process.argv[2] !== 'drop')) return [3 /*break*/, 7];
                    return [4 /*yield*/, Promise.all(tables.map(function (t) {
                            return client.query("\n        create trigger trg_".concat(t, "\n          after insert or update on ").concat(t, "\n          for each row execute procedure ").concat(functionName, "();"));
                        }))];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    client.release();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setupTriggers = setupTriggers;
