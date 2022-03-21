'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var require$$1 = require('@project-serum/anchor');
var require$$2$1 = require('@solana/web3.js');
var require$$4 = require('secp256k1');
var require$$2 = require('bn.js');
var require$$3 = require('crypto');
var require$$5 = require('keccak256');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);
var require$$2__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$2$1);
var require$$4__default = /*#__PURE__*/_interopDefaultLegacy(require$$4);
var require$$2__default = /*#__PURE__*/_interopDefaultLegacy(require$$2);
var require$$3__default = /*#__PURE__*/_interopDefaultLegacy(require$$3);
var require$$5__default = /*#__PURE__*/_interopDefaultLegacy(require$$5);

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var lib$1 = {};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
}
var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

var tslib_es6 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	__extends: __extends,
	get __assign () { return __assign; },
	__rest: __rest,
	__decorate: __decorate,
	__param: __param,
	__metadata: __metadata,
	__awaiter: __awaiter,
	__generator: __generator,
	__createBinding: __createBinding,
	__exportStar: __exportStar,
	__values: __values,
	__read: __read,
	__spread: __spread,
	__spreadArrays: __spreadArrays,
	__spreadArray: __spreadArray,
	__await: __await,
	__asyncGenerator: __asyncGenerator,
	__asyncDelegator: __asyncDelegator,
	__asyncValues: __asyncValues,
	__makeTemplateObject: __makeTemplateObject,
	__importStar: __importStar,
	__importDefault: __importDefault,
	__classPrivateFieldGet: __classPrivateFieldGet,
	__classPrivateFieldSet: __classPrivateFieldSet
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(tslib_es6);

var utils = {};

(function (exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDerivedPair = exports.findDerivedAddress = exports.findProgramAddress = exports.randomCID = exports.randomString = exports.signBytes = exports.getTransactionWithData = exports.decodeInstruction = exports.getTransaction = exports.ethAddressToArray = exports.SystemSysVarProgramKey = void 0;
const tslib_1 = require$$0;
const anchor = tslib_1.__importStar(require$$1__default["default"]);
const bn_js_1 = tslib_1.__importDefault(require$$2__default["default"]);
const crypto_1 = require$$3__default["default"];
const secp256k1 = tslib_1.__importStar(require$$4__default["default"]);
const keccak256_1 = tslib_1.__importDefault(require$$5__default["default"]);
const { PublicKey } = anchor.web3;
exports.SystemSysVarProgramKey = new PublicKey("Sysvar1nstructions1111111111111111111111111");
/// Convert a string input to output array of Uint8
const ethAddressToArray = (ethAddress) => {
    const strippedEthAddress = ethAddress.replace("0x", "");
    return Uint8Array.of(...new bn_js_1.default(strippedEthAddress, "hex").toArray("be", 20));
};
exports.ethAddressToArray = ethAddressToArray;
/// Retrieve a transaction with retries
const getTransaction = async (provider, tx) => {
    let info = await provider.connection.getTransaction(tx);
    while (info == null) {
        info = await provider.connection.getTransaction(tx);
    }
    return info;
};
exports.getTransaction = getTransaction;
const decodeInstruction = (program, data) => {
    const instructionCoder = program.coder.instruction;
    const decodedInstruction = instructionCoder.decode(data, "base58");
    return decodedInstruction;
};
exports.decodeInstruction = decodeInstruction;
const getTransactionWithData = async (program, provider, tx) => {
    const info = await (0, exports.getTransaction)(provider, tx);
    const data = info.transaction.message.instructions[0].data;
    const decodedInstruction = (0, exports.decodeInstruction)(program, data);
    const accountIndexes = info.transaction.message.instructions[0].accounts;
    const accountKeys = info.transaction.message.accountKeys;
    const accountPubKeys = [];
    for (const i of accountIndexes) {
        accountPubKeys.push(accountKeys[i].toString());
    }
    const decodedData = decodedInstruction.data;
    return {
        info,
        data,
        decodedInstruction,
        decodedData,
        accountPubKeys,
    };
};
exports.getTransactionWithData = getTransactionWithData;
/// Sign any bytes object with the provided eth private key
const signBytes = (bytes, ethPrivateKey) => {
    const ethPrivateKeyArr = anchor.utils.bytes.hex.decode(ethPrivateKey);
    const msgHash = (0, keccak256_1.default)(bytes);
    const signatureObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), ethPrivateKeyArr);
    const signature = Buffer.from(signatureObj.signature);
    return {
        signature,
        recoveryId: signatureObj.recid,
    };
};
exports.signBytes = signBytes;
/// Generate random valid string
const randomString = (size) => {
    if (size === 0) {
        throw new Error("Zero-length randomString is useless.");
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789";
    let objectId = "";
    const bytes = (0, crypto_1.randomBytes)(size);
    for (let i = 0; i < bytes.length; ++i) {
        objectId += chars[bytes.readUInt8(i) % chars.length];
    }
    return objectId;
};
exports.randomString = randomString;
/// Generate mock CID by appending `Qm` with a rand string
const randomCID = () => {
    const randomSuffix = (0, exports.randomString)(44);
    const cid = `Qm${randomSuffix}`;
    return cid;
};
exports.randomCID = randomCID;
/// Derive a program address with pubkey as the seed
const findProgramAddress = (programId, pubkey) => {
    return PublicKey.findProgramAddress([pubkey.toBytes().slice(0, 32)], programId);
};
exports.findProgramAddress = findProgramAddress;
// Finds a 'derived' address by finding a programAddress with
// seeds array  as first 32 bytes of base + seeds
const findDerivedAddress = async (programId, base, seed) => {
    const finalSeed = [base.toBytes().slice(0, 32), seed];
    const result = await PublicKey.findProgramAddress(finalSeed, programId);
    return {
        seed: finalSeed,
        result,
    };
};
exports.findDerivedAddress = findDerivedAddress;
// Finds the target PDA with the base audius admin as the initial seed
// In conjunction with the secondary seed as the users handle in bytes
const findDerivedPair = async (programId, adminAccount, seed) => {
    const [baseAuthorityAccount] = await (0, exports.findProgramAddress)(programId, adminAccount);
    const derivedAddresInfo = await (0, exports.findDerivedAddress)(programId, baseAuthorityAccount, seed);
    const derivedAddress = derivedAddresInfo.result[0];
    const bumpSeed = derivedAddresInfo.result[1];
    return { baseAuthorityAccount, derivedAddress, bumpSeed };
};
exports.findDerivedPair = findDerivedPair;

}(utils));

(function (exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeypairFromSecretKey = exports.deletePlaylist = exports.updatePlaylist = exports.createPlaylist = exports.writePlaylistSocialAction = exports.writeTrackSocialAction = exports.deleteTrack = exports.updateTrack = exports.createTrack = exports.updateIsVerified = exports.updateAdmin = exports.updateUser = exports.createUser = exports.initUserSolPubkey = exports.initUser = exports.initAdmin = exports.ManagementActions = exports.EntityTypesEnumValues = exports.PlaylistSocialActionEnumValues = exports.TrackSocialActionEnumValues = void 0;
const tslib_1 = require$$0;
/**
 * Library of typescript functions used in tests/CLI
 * Intended for later integration with libs
 */
const anchor = tslib_1.__importStar(require$$1__default["default"]);
const web3_js_1 = require$$2__default$1["default"];
const secp256k1 = tslib_1.__importStar(require$$4__default["default"]);
const utils_1 = utils;
const { SystemProgram, Transaction, Secp256k1Program } = anchor.web3;
exports.TrackSocialActionEnumValues = {
    addSave: { addSave: {} },
    deleteSave: { deleteSave: {} },
    addRepost: { addRepost: {} },
    deleteRepost: { deleteRepost: {} },
};
exports.PlaylistSocialActionEnumValues = {
    addSave: { addSave: {} },
    deleteSave: { deleteSave: {} },
    addRepost: { addRepost: {} },
    deleteRepost: { deleteRepost: {} },
};
exports.EntityTypesEnumValues = {
    track: { track: {} },
    playlist: { playlist: {} },
};
exports.ManagementActions = {
    create: { create: {} },
    update: { update: {} },
    delete: { delete: {} },
};
const initAdmin = async ({ provider, program, adminKeypair, adminStgKeypair, verifierKeypair, playlistIdOffset, }) => {
    return program.rpc.initAdmin(adminKeypair.publicKey, verifierKeypair.publicKey, playlistIdOffset, {
        accounts: {
            admin: adminStgKeypair.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [adminStgKeypair],
    });
};
exports.initAdmin = initAdmin;
const initUser = async ({ provider, program, ethAddress, handleBytesArray, bumpSeed, metadata, userStgAccount, baseAuthorityAccount, adminStgKey, adminKeypair, }) => {
    return program.rpc.initUser(baseAuthorityAccount, [...anchor.utils.bytes.hex.decode(ethAddress)], handleBytesArray, bumpSeed, metadata, {
        accounts: {
            admin: adminStgKey,
            payer: provider.wallet.publicKey,
            user: userStgAccount,
            authority: adminKeypair.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [adminKeypair],
    });
};
exports.initUser = initUser;
const initUserSolPubkey = async ({ provider, program, ethPrivateKey, message, userSolPubkey, userStgAccount, }) => {
    const { signature, recoveryId } = (0, utils_1.signBytes)(message, ethPrivateKey);
    // Get the public key in a compressed format
    const ethPubkey = secp256k1
        .publicKeyCreate(anchor.utils.bytes.hex.decode(ethPrivateKey), false)
        .slice(1);
    const tx = new Transaction();
    tx.add(Secp256k1Program.createInstructionWithPublicKey({
        publicKey: ethPubkey,
        message: message,
        recoveryId: recoveryId,
        signature: signature,
    }));
    tx.add(program.instruction.initUserSol(userSolPubkey, {
        accounts: {
            user: userStgAccount,
            sysvarProgram: utils_1.SystemSysVarProgramKey,
        },
    }));
    return provider.send(tx);
};
exports.initUserSolPubkey = initUserSolPubkey;
const createUser = async ({ baseAuthorityAccount, program, ethAccount, message, handleBytesArray, bumpSeed, metadata, provider, userSolPubkey, userStgAccount, adminStgPublicKey, }) => {
    const { signature, recoveryId } = (0, utils_1.signBytes)(message, ethAccount.privateKey);
    // Get the public key in a compressed format
    const ethPubkey = secp256k1
        .publicKeyCreate(anchor.utils.bytes.hex.decode(ethAccount.privateKey), false)
        .slice(1);
    const tx = new Transaction();
    tx.add(Secp256k1Program.createInstructionWithPublicKey({
        publicKey: ethPubkey,
        message: message,
        signature,
        recoveryId,
    }));
    tx.add(program.instruction.createUser(baseAuthorityAccount, [...anchor.utils.bytes.hex.decode(ethAccount.address)], handleBytesArray, bumpSeed, metadata, userSolPubkey, {
        accounts: {
            payer: provider.wallet.publicKey,
            user: userStgAccount,
            systemProgram: SystemProgram.programId,
            sysvarProgram: utils_1.SystemSysVarProgramKey,
            audiusAdmin: adminStgPublicKey,
        },
    }));
    return provider.send(tx);
};
exports.createUser = createUser;
const updateUser = async ({ program, metadata, userStgAccount, userAuthorityKeypair, userDelegateAuthority, }) => {
    return program.rpc.updateUser(metadata, {
        accounts: {
            user: userStgAccount,
            userAuthority: userAuthorityKeypair.publicKey,
            userDelegateAuthority,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.updateUser = updateUser;
const updateAdmin = async ({ program, isWriteEnabled, adminStgAccount, adminAuthorityKeypair, }) => {
    return program.rpc.updateAdmin(isWriteEnabled, {
        accounts: {
            admin: adminStgAccount,
            adminAuthority: adminAuthorityKeypair.publicKey,
        },
        signers: [adminAuthorityKeypair],
    });
};
exports.updateAdmin = updateAdmin;
const updateIsVerified = async ({ program, adminKeypair, userStgAccount, verifierKeypair, baseAuthorityAccount, handleBytesArray, bumpSeed, }) => {
    return program.rpc.updateIsVerified(baseAuthorityAccount, { seed: handleBytesArray, bump: bumpSeed }, {
        accounts: {
            user: userStgAccount,
            audiusAdmin: adminKeypair.publicKey,
            verifier: verifierKeypair.publicKey,
        },
        signers: [verifierKeypair],
    });
};
exports.updateIsVerified = updateIsVerified;
const createTrack = async ({ id, program, baseAuthorityAccount, userAuthorityKeypair, userStgAccountPDA, metadata, handleBytesArray, adminStgAccount, bumpSeed, }) => {
    return program.rpc.manageEntity(baseAuthorityAccount, { seed: handleBytesArray, bump: bumpSeed }, exports.EntityTypesEnumValues.track, exports.ManagementActions.create, id, metadata, {
        accounts: {
            audiusAdmin: adminStgAccount,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.createTrack = createTrack;
const updateTrack = async ({ program, baseAuthorityAccount, id, metadata, userAuthorityKeypair, userStgAccountPDA, handleBytesArray, adminStgAccount, bumpSeed, }) => {
    return program.rpc.manageEntity(baseAuthorityAccount, { seed: handleBytesArray, bump: bumpSeed }, exports.EntityTypesEnumValues.track, exports.ManagementActions.update, id, metadata, {
        accounts: {
            audiusAdmin: adminStgAccount,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.updateTrack = updateTrack;
const deleteTrack = async ({ program, id, userStgAccountPDA, userAuthorityKeypair, baseAuthorityAccount, handleBytesArray, adminStgAccount, bumpSeed, }) => {
    return program.rpc.manageEntity(baseAuthorityAccount, { seed: handleBytesArray, bump: bumpSeed }, exports.EntityTypesEnumValues.track, exports.ManagementActions.delete, id, "", // Empty string for metadata in delete
    {
        accounts: {
            audiusAdmin: adminStgAccount,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.deleteTrack = deleteTrack;
const writeTrackSocialAction = async ({ program, baseAuthorityAccount, userStgAccountPDA, userAuthorityKeypair, handleBytesArray, bumpSeed, adminStgPublicKey, trackSocialAction, trackId, }) => {
    return program.rpc.writeTrackSocialAction(baseAuthorityAccount, { seed: handleBytesArray, bump: bumpSeed }, trackSocialAction, trackId, {
        accounts: {
            audiusAdmin: adminStgPublicKey,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.writeTrackSocialAction = writeTrackSocialAction;
const writePlaylistSocialAction = async ({ program, baseAuthorityAccount, userStgAccountPDA, userAuthorityKeypair, handleBytesArray, bumpSeed, adminStgPublicKey, playlistSocialAction, playlistId, }) => {
    return program.rpc.writePlaylistSocialAction(baseAuthorityAccount, { seed: handleBytesArray, bump: bumpSeed }, playlistSocialAction, playlistId, {
        accounts: {
            audiusAdmin: adminStgPublicKey,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.writePlaylistSocialAction = writePlaylistSocialAction;
const createPlaylist = async ({ provider, program, newPlaylistKeypair, userStgAccountPDA, userAuthorityKeypair, adminStgPublicKey, metadata, }) => {
    return program.rpc.createPlaylist(metadata, {
        accounts: {
            playlist: newPlaylistKeypair.publicKey,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
            audiusAdmin: adminStgPublicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [newPlaylistKeypair, userAuthorityKeypair],
    });
};
exports.createPlaylist = createPlaylist;
const updatePlaylist = async ({ program, playlistPublicKey, userStgAccountPDA, userAuthorityKeypair, metadata, }) => {
    return program.rpc.updatePlaylist(metadata, {
        accounts: {
            playlist: playlistPublicKey,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.updatePlaylist = updatePlaylist;
const deletePlaylist = async ({ provider, program, playlistPublicKey, userStgAccountPDA, userAuthorityKeypair, }) => {
    return program.rpc.deletePlaylist({
        accounts: {
            playlist: playlistPublicKey,
            user: userStgAccountPDA,
            authority: userAuthorityKeypair.publicKey,
            payer: provider.wallet.publicKey,
        },
        signers: [userAuthorityKeypair],
    });
};
exports.deletePlaylist = deletePlaylist;
/// Get keypair from secret key
const getKeypairFromSecretKey = async (secretKey) => {
    return web3_js_1.Keypair.fromSecretKey(Uint8Array.from(secretKey));
};
exports.getKeypairFromSecretKey = getKeypairFromSecretKey;

}(lib$1));

var lib = /*@__PURE__*/getDefaultExportFromCjs(lib$1);

exports["default"] = lib;
