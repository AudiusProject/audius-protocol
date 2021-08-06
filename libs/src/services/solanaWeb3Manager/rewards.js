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
};
var __read = (this && this.__read) || function (o, n) {
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
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.transfer = exports.verifyTransferSignature = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var borsh = require('borsh');
var getBankAccountAddress = require('./userBank').getBankAccountAddress;
var BN = require('bn.js');
/// Sender program account seed
var SENDER_SEED_PREFIX = "S_";
var VERIFY_TRANSFER_SEED_PREFIX = "V_";
var TRANSFER_PREFIX = "T_";
var DECIMALS = 9;
// 1 + 32 + 1 + (168 * 5)
var VERIFIED_MESSAGES_LEN = 874;
// 3qvNmjbxmF9CDHzAEBvLSePRiMWtVcXPaRPiPtmrT29xkj
// @ts-ignore
window.bn = BN;
var VerifyTransferSignatureInstructionData = /** @class */ (function () {
    function VerifyTransferSignatureInstructionData(_a) {
        var transferId = _a.transferId;
        this.id = transferId;
    }
    return VerifyTransferSignatureInstructionData;
}());
var verifyTransferSignatureInstructionSchema = new Map([
    [
        VerifyTransferSignatureInstructionData,
        {
            kind: 'struct',
            fields: [
                ['id', 'string']
            ]
        }
    ]
]);
var TransferInstructionData = /** @class */ (function () {
    function TransferInstructionData(_a) {
        var amount = _a.amount, id = _a.id, eth_recipient = _a.eth_recipient;
        this.amount = amount;
        this.id = id;
        this.eth_recipient = eth_recipient;
    }
    return TransferInstructionData;
}());
var transferInstructionSchema = new Map([
    [
        TransferInstructionData,
        {
            kind: 'struct',
            fields: [
                ['amount', 'u64'],
                ['id', 'string'],
                ['eth_recipient', [20]]
            ]
        }
    ]
]);
var ethAddressToArr = function (ethAddress) {
    var strippedEthAddress = ethAddress.replace('0x', '');
    return Uint8Array.of.apply(Uint8Array, __spreadArray([], __read(new BN(strippedEthAddress, 'hex').toArray('be'))));
};
var constructTransferId = function (challengeId, specifier) { return challengeId + ":" + specifier; };
var createAmount = function (amount) {
    var padded = amount * Math.pow(10, DECIMALS);
    return (new BN(padded)).toArray('le', 8);
};
var constructAttestation = function (isBot, recipientEthAddress, tokenAmount, transferId, oracleAddress) {
    console.log("CONSTRUCTING!!!");
    var encoder = new TextEncoder();
    var userBytes = ethAddressToArr(recipientEthAddress);
    var oracleBytes = ethAddressToArr(oracleAddress);
    var transferIdBytes = encoder.encode(transferId);
    var amountBytes = createAmount(tokenAmount);
    console.log({ amountBytes: amountBytes });
    var items = isBot ? [userBytes, amountBytes, transferIdBytes] : [userBytes, amountBytes, transferIdBytes, oracleBytes];
    var sep = encoder.encode('_');
    var res = items.slice(1).reduce(function (prev, cur, i) {
        return Uint8Array.of.apply(Uint8Array, __spreadArray(__spreadArray(__spreadArray([], __read(prev)), __read(sep)), __read(cur)));
    }, Uint8Array.from(items[0]));
    return res;
};
function verifyTransferSignature(_a) {
    var rewardManagerProgramId = _a.rewardManagerProgramId, rewardManagerAccount = _a.rewardManagerAccount, ethAddress = _a.ethAddress, challengeId = _a.challengeId, specifier = _a.specifier, feePayer = _a.feePayer, feePayerSecret = _a.feePayerSecret, // Remove this :)
    attestationSignature = _a.attestationSignature, recipientEthAddress = _a.recipientEthAddress, tokenAmount = _a.tokenAmount, oracleAddress = _a.oracleAddress, _b = _a.isBot, isBot = _b === void 0 ? false : _b;
    return __awaiter(this, void 0, void 0, function () {
        var connection, encoder, encodedPrefix, ethAddressArr, _c, derivedSender, transferId, _d, rewardManagerAuthority, derivedMessageAccount, verifyInstructionAccounts, instructionData, serializedInstructionData, serializedInstructionEnum, verifyTransferSignatureInstruction, encodedSenderMessage, strippedSignature, recoveryIdStr, recoveryId, encodedSignature, secpInstruction, instructions, recentBlockhash, transaction, transactionSignature, e_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    connection = new web3_js_1.Connection('https://api.devnet.solana.com');
                    encoder = new TextEncoder();
                    encodedPrefix = encoder.encode(SENDER_SEED_PREFIX);
                    ethAddressArr = ethAddressToArr(ethAddress);
                    return [4 /*yield*/, findDerivedPair(rewardManagerProgramId, rewardManagerAccount, new Uint8Array(__spreadArray(__spreadArray([], __read(encodedPrefix)), __read(ethAddressArr))))];
                case 1:
                    _c = __read.apply(void 0, [_e.sent(), 2]), derivedSender = _c[1];
                    transferId = constructTransferId(challengeId, specifier);
                    return [4 /*yield*/, deriveMessageAccount(transferId, rewardManagerProgramId, rewardManagerAccount)
                        ///   Verify transfer signature
                        ///
                        ///   0. `[writable]` New or existing account storing verified messages
                        ///   1. `[]` Reward manager
                        ///   1. `[]` Reward manager authority (NEW)
                        ///   1. `[]` fee payer (NEW)
                        ///   2. `[]` Sender
                        ///   2. `[]` sysvar rent (new)
                        ///   3. `[]` Sysvar instruction id (NEW)
                    ];
                case 2:
                    _d = __read.apply(void 0, [_e.sent()
                        ///   Verify transfer signature
                        ///
                        ///   0. `[writable]` New or existing account storing verified messages
                        ///   1. `[]` Reward manager
                        ///   1. `[]` Reward manager authority (NEW)
                        ///   1. `[]` fee payer (NEW)
                        ///   2. `[]` Sender
                        ///   2. `[]` sysvar rent (new)
                        ///   3. `[]` Sysvar instruction id (NEW)
                        , 2]), rewardManagerAuthority = _d[0], derivedMessageAccount = _d[1];
                    verifyInstructionAccounts = [
                        {
                            pubkey: derivedMessageAccount,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: rewardManagerAccount,
                            isSigner: false,
                            isWritable: false
                        },
                        {
                            pubkey: rewardManagerAuthority,
                            isSigner: false,
                            isWritable: false
                        },
                        {
                            pubkey: feePayer,
                            isSigner: true,
                            isWritable: true
                        },
                        {
                            pubkey: derivedSender,
                            isSigner: false,
                            isWritable: false
                        },
                        {
                            pubkey: web3_js_1.SYSVAR_RENT_PUBKEY,
                            isSigner: false,
                            isWritable: false
                        },
                        {
                            pubkey: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
                            isSigner: false,
                            isWritable: false
                        },
                        {
                            pubkey: web3_js_1.SystemProgram.programId,
                            isSigner: false,
                            isWritable: false
                        }
                    ];
                    instructionData = new VerifyTransferSignatureInstructionData({ transferId: transferId });
                    serializedInstructionData = borsh.serialize(verifyTransferSignatureInstructionSchema, instructionData);
                    serializedInstructionEnum = Buffer.from(Uint8Array.of.apply(Uint8Array, __spreadArray([4], __read(serializedInstructionData))));
                    verifyTransferSignatureInstruction = new web3_js_1.TransactionInstruction({
                        keys: verifyInstructionAccounts,
                        programId: rewardManagerProgramId,
                        data: serializedInstructionEnum
                    });
                    encodedSenderMessage = constructAttestation(isBot, recipientEthAddress, tokenAmount, transferId, oracleAddress);
                    strippedSignature = attestationSignature.replace('0x', '');
                    recoveryIdStr = strippedSignature.slice(strippedSignature.length - 2);
                    recoveryId = new BN(recoveryIdStr, 'hex').toNumber();
                    strippedSignature = strippedSignature.slice(0, strippedSignature.length - 2);
                    encodedSignature = Uint8Array.of.apply(Uint8Array, __spreadArray([], __read(new BN(strippedSignature, 'hex').toArray('be') // 0 pad to add length, but this seems wrong. Idk
                    )));
                    secpInstruction = web3_js_1.Secp256k1Program.createInstructionWithEthAddress({
                        ethAddress: ethAddress,
                        message: encodedSenderMessage,
                        signature: encodedSignature,
                        recoveryId: recoveryId
                    });
                    instructions = [
                        secpInstruction,
                        verifyTransferSignatureInstruction
                    ];
                    return [4 /*yield*/, connection.getRecentBlockhash()];
                case 3:
                    recentBlockhash = (_e.sent()).blockhash;
                    transaction = new web3_js_1.Transaction({
                        feePayer: feePayer,
                        recentBlockhash: recentBlockhash
                    });
                    transaction.add.apply(transaction, __spreadArray([], __read(instructions)));
                    // Sign with the fee payer
                    transaction.sign({
                        publicKey: feePayer,
                        secretKey: feePayerSecret
                    });
                    _e.label = 4;
                case 4:
                    _e.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, web3_js_1.sendAndConfirmTransaction(connection, transaction, [
                            {
                                publicKey: feePayer,
                                secretKey: feePayerSecret
                            },
                        ], {
                            skipPreflight: false,
                            commitment: 'processed',
                            preflightCommitment: 'processed'
                        })];
                case 5:
                    transactionSignature = _e.sent();
                    return [2 /*return*/, transactionSignature];
                case 6:
                    e_1 = _e.sent();
                    console.error("SENT BUT ERROR");
                    console.error(e_1.message);
                    console.log({ e: e_1 });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.verifyTransferSignature = verifyTransferSignature;
var transfer = function (_a) {
    var rewardProgramId = _a.rewardProgramId, rewardManagerAccount = _a.rewardManagerAccount, rewardManagerTokenSource = _a.rewardManagerTokenSource, challengeId = _a.challengeId, specifier = _a.specifier, recipientEthAddress = _a.recipientEthAddress, userBankAccount = _a.userBankAccount, oracleEthAddress = _a.oracleEthAddress, feePayer = _a.feePayer, feePayerSecret = _a.feePayerSecret, amount = _a.amount;
    return __awaiter(void 0, void 0, void 0, function () {
        var encoder, transferId, _b, rewardManagerAuthority, verifiedMessagesAccount, transferAccount, recipientBankAccount, _c, _, derivedBotAddress, accounts, instructionData, serializedInstructionData, serializedInstructionEnum, connection, transferInstruction, recentBlockhash, transaction, transactionSignature, e_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    encoder = new TextEncoder();
                    transferId = constructTransferId(challengeId, specifier);
                    return [4 /*yield*/, deriveMessageAccount(transferId, rewardProgramId, rewardManagerAccount)];
                case 1:
                    _b = __read.apply(void 0, [_d.sent(), 2]), rewardManagerAuthority = _b[0], verifiedMessagesAccount = _b[1];
                    return [4 /*yield*/, deriveTransferAccount(transferId, rewardProgramId, rewardManagerAccount)
                        // G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s
                    ];
                case 2:
                    transferAccount = _d.sent();
                    return [4 /*yield*/, getBankAccountAddress(recipientEthAddress, userBankAccount, spl_token_1.TOKEN_PROGRAM_ID)];
                case 3:
                    recipientBankAccount = _d.sent();
                    return [4 /*yield*/, findDerivedPair(rewardProgramId, rewardManagerAccount, Uint8Array.from(__spreadArray(__spreadArray([], __read(encoder.encode(SENDER_SEED_PREFIX))), __read(ethAddressToArr(oracleEthAddress)))))];
                case 4:
                    _c = __read.apply(void 0, [_d.sent(), 2]), _ = _c[0], derivedBotAddress = _c[1];
                    console.log({ derivedBotAddress: derivedBotAddress });
                    accounts = [
                        {
                            pubkey: verifiedMessagesAccount,
                            isSigner: false,
                            isWritable: true
                        }, {
                            pubkey: rewardManagerAccount,
                            isSigner: false,
                            isWritable: false
                        }, {
                            pubkey: rewardManagerAuthority,
                            isSigner: false,
                            isWritable: false
                        }, {
                            pubkey: rewardManagerTokenSource,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: recipientBankAccount,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: transferAccount,
                            isSigner: false,
                            isWritable: true
                        }, {
                            pubkey: derivedBotAddress,
                            isSigner: false,
                            isWritable: false
                        },
                        {
                            pubkey: feePayer,
                            isSigner: true,
                            isWritable: true
                        },
                        {
                            pubkey: web3_js_1.SYSVAR_RENT_PUBKEY,
                            isSigner: false,
                            isWritable: false
                        }, {
                            pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                            isSigner: false,
                            isWritable: false
                        }, {
                            pubkey: web3_js_1.SystemProgram.programId,
                            isSigner: false,
                            isWritable: false
                        }
                    ];
                    instructionData = new TransferInstructionData({
                        amount: amount * Math.pow(10, DECIMALS),
                        id: transferId,
                        eth_recipient: ethAddressToArr(recipientEthAddress)
                    });
                    serializedInstructionData = borsh.serialize(transferInstructionSchema, instructionData);
                    serializedInstructionEnum = Buffer.from(Uint8Array.of.apply(Uint8Array, __spreadArray([5], __read(serializedInstructionData))));
                    connection = new web3_js_1.Connection('https://api.devnet.solana.com');
                    transferInstruction = new web3_js_1.TransactionInstruction({
                        keys: accounts,
                        programId: rewardProgramId,
                        data: serializedInstructionEnum
                    });
                    return [4 /*yield*/, connection.getRecentBlockhash()];
                case 5:
                    recentBlockhash = (_d.sent()).blockhash;
                    transaction = new web3_js_1.Transaction({
                        feePayer: feePayer,
                        recentBlockhash: recentBlockhash
                    });
                    transaction.add(transferInstruction);
                    transaction.sign({
                        publicKey: feePayer,
                        secretKey: feePayerSecret
                    });
                    _d.label = 6;
                case 6:
                    _d.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, web3_js_1.sendAndConfirmTransaction(connection, transaction, [
                            {
                                publicKey: feePayer,
                                secretKey: feePayerSecret
                            },
                        ], {
                            skipPreflight: false,
                            commitment: 'processed',
                            preflightCommitment: 'processed'
                        })];
                case 7:
                    transactionSignature = _d.sent();
                    return [2 /*return*/, transactionSignature];
                case 8:
                    e_2 = _d.sent();
                    console.error("SENT BUT ERROR");
                    console.error(e_2.message);
                    console.log({ e: e_2 });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
};
exports.transfer = transfer;
var deriveTransferAccount = function (transferId, rewardProgramId, rewardManager) { return __awaiter(void 0, void 0, void 0, function () {
    var encoder, seed, _a, _, derivedAddress;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                encoder = new TextEncoder();
                seed = Uint8Array.from(__spreadArray(__spreadArray([], __read(encoder.encode(TRANSFER_PREFIX))), __read(encoder.encode(transferId))));
                return [4 /*yield*/, findDerivedPair(rewardProgramId, rewardManager, seed)];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 2]), _ = _a[0], derivedAddress = _a[1];
                return [2 /*return*/, derivedAddress];
        }
    });
}); };
// Derives the account for messages to live in
var deriveMessageAccount = function (transferId, rewardsProgramId, rewardManager) { return __awaiter(void 0, void 0, void 0, function () {
    var encoder, encodedPrefix, encodedTransferId, seeds;
    return __generator(this, function (_a) {
        encoder = new TextEncoder();
        encodedPrefix = encoder.encode(VERIFY_TRANSFER_SEED_PREFIX);
        encodedTransferId = encoder.encode(transferId);
        seeds = Uint8Array.from(__spreadArray(__spreadArray([], __read(encodedPrefix)), __read(encodedTransferId)));
        return [2 /*return*/, findDerivedPair(rewardsProgramId, rewardManager, seeds)];
    });
}); };
var findProgramAddress = function (programId, pubkey) {
    return web3_js_1.PublicKey.findProgramAddress([pubkey.toBytes().slice(0, 32)], programId);
};
// Finds a 'derived' address by finding a programAddress with
// seeds array  as first 32 bytes of base + seeds
// Returns [derivedAddress, bumpSeed]
var findDerivedAddress = function (programId, base, seed) {
    return web3_js_1.PublicKey.findProgramAddress([base.toBytes().slice(0, 32), seed], programId);
};
var findDerivedPair = function (programId, rewardManager, seed) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, rewardManagerAuthority, _b, derivedAddress, bumpSeed;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, findProgramAddress(programId, rewardManager)];
            case 1:
                _a = __read.apply(void 0, [_c.sent(), 1]), rewardManagerAuthority = _a[0];
                return [4 /*yield*/, findDerivedAddress(programId, rewardManagerAuthority, seed)];
            case 2:
                _b = __read.apply(void 0, [_c.sent(), 2]), derivedAddress = _b[0], bumpSeed = _b[1];
                return [2 /*return*/, [rewardManagerAuthority, derivedAddress, bumpSeed]];
        }
    });
}); };
