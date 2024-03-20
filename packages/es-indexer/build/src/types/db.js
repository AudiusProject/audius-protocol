"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.challengetype = exports.delist_entity = exports.delist_track_reason = exports.delist_user_reason = exports.reposttype = exports.savetype = exports.skippedtransactionlevel = exports.usdc_purchase_content_type = exports.wallet_chain = void 0;
var wallet_chain;
(function (wallet_chain) {
    wallet_chain["eth"] = "eth";
    wallet_chain["sol"] = "sol";
})(wallet_chain || (exports.wallet_chain = wallet_chain = {}));
var usdc_purchase_content_type;
(function (usdc_purchase_content_type) {
    usdc_purchase_content_type["track"] = "track";
    usdc_purchase_content_type["playlist"] = "playlist";
    usdc_purchase_content_type["album"] = "album";
})(usdc_purchase_content_type || (exports.usdc_purchase_content_type = usdc_purchase_content_type = {}));
var skippedtransactionlevel;
(function (skippedtransactionlevel) {
    skippedtransactionlevel["node"] = "node";
    skippedtransactionlevel["network"] = "network";
})(skippedtransactionlevel || (exports.skippedtransactionlevel = skippedtransactionlevel = {}));
var savetype;
(function (savetype) {
    savetype["track"] = "track";
    savetype["playlist"] = "playlist";
    savetype["album"] = "album";
})(savetype || (exports.savetype = savetype = {}));
var reposttype;
(function (reposttype) {
    reposttype["track"] = "track";
    reposttype["playlist"] = "playlist";
    reposttype["album"] = "album";
})(reposttype || (exports.reposttype = reposttype = {}));
var delist_user_reason;
(function (delist_user_reason) {
    delist_user_reason["STRIKE_THRESHOLD"] = "STRIKE_THRESHOLD";
    delist_user_reason["COPYRIGHT_SCHOOL"] = "COPYRIGHT_SCHOOL";
    delist_user_reason["MANUAL"] = "MANUAL";
})(delist_user_reason || (exports.delist_user_reason = delist_user_reason = {}));
var delist_track_reason;
(function (delist_track_reason) {
    delist_track_reason["DMCA"] = "DMCA";
    delist_track_reason["ACR"] = "ACR";
    delist_track_reason["MANUAL"] = "MANUAL";
    delist_track_reason["ACR_COUNTER_NOTICE"] = "ACR_COUNTER_NOTICE";
    delist_track_reason["DMCA_RETRACTION"] = "DMCA_RETRACTION";
    delist_track_reason["DMCA_COUNTER_NOTICE"] = "DMCA_COUNTER_NOTICE";
    delist_track_reason["DMCA_AND_ACR_COUNTER_NOTICE"] = "DMCA_AND_ACR_COUNTER_NOTICE";
})(delist_track_reason || (exports.delist_track_reason = delist_track_reason = {}));
var delist_entity;
(function (delist_entity) {
    delist_entity["TRACKS"] = "TRACKS";
    delist_entity["USERS"] = "USERS";
})(delist_entity || (exports.delist_entity = delist_entity = {}));
var challengetype;
(function (challengetype) {
    challengetype["boolean"] = "boolean";
    challengetype["numeric"] = "numeric";
    challengetype["aggregate"] = "aggregate";
    challengetype["trending"] = "trending";
})(challengetype || (exports.challengetype = challengetype = {}));
