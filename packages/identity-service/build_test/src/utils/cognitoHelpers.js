"use strict";
const crypto = require('crypto');
const config = require('../config');
const Web3 = require('web3');
const web3 = new Web3();
const sign = (reference) => {
    const apiSecret = config.get('cognitoAPISecret');
    if (!apiSecret)
        throw new Error('Missing API Secret');
    const signer = crypto.createHmac('sha256', apiSecret);
    const result = signer.update(reference).digest();
    const base64 = Buffer.from(result).toString('base64');
    return base64;
};
/**
 * Hashes a string to SHA-256 and base64 encodes it
 * @param {string} data The data to turn into a SHA-256 digest
 * @returns a base64 encoded string of the hash prefixed with "SHA-256="
 */
const createDigest = (data) => {
    const hasher = crypto.createHash('sha256');
    const result = hasher.update(data, 'utf-8').digest('base64');
    return `SHA-256=${result}`;
};
const doesSignatureMatch = (authorizationHeader, signature) => {
    const apiKey = config.get('cognitoAPIKey');
    const expectedHeader = `Signature keyId="${apiKey}",algorithm="hmac-sha256",headers="(request-target) date digest",signature="${signature}"`;
    return expectedHeader === authorizationHeader;
};
/**
 * @typedef CognitoHeaders Required headers for an API request to the Cognito API
 * @property {string} Date the current date, formatted for an HTTP request (UTC)
 * @property {string} Digest a SHA-256 hash of the body of the request
 * @property {string} Authorization the signature, using the API secret and HMAC SHA-256
 * @property {'application/vnd.api+json'} Content-Type
 * @property {'application/vnd.api+json'} Accept
 * @property {'2020-08-14'} Cognito-Version
 */
/**
 * Creates headers required for authenticating a request to the Cognito API given the request information
 * https://cognitohq.com/docs/guides/authenticating
 * @param {Object} requestInfo the request information used to generate the headers
 * @param {string} requestInfo.method the HTTP method used in the request
 * @param {string} requestInfo.path the relative path (including query string) of the resource
 * @param {string} requestInfo.body the body of the HTTP request
 * @returns {CognitoHeaders} the headers authenticating a Cognito API request
 */
const createCognitoHeaders = ({ path, method, body }) => {
    const apiKey = config.get('cognitoAPIKey');
    const httpDate = new Date().toUTCString();
    const requestTarget = `${method.toLowerCase()} ${path}`;
    const digest = createDigest(body);
    const signingString = [
        `(request-target): ${requestTarget}`,
        `date: ${httpDate}`,
        `digest: ${digest}`
    ].join('\n');
    const signature = sign(signingString);
    return {
        Date: httpDate,
        Digest: digest,
        Authorization: `Signature keyId="${apiKey}",algorithm="hmac-sha256",headers="(request-target) date digest",signature="${signature}"`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        'Cognito-Version': '2020-08-14'
    };
};
const isWebhookValid = (headers, path) => {
    // construct string that we will be signing
    const lines = [];
    lines.push(`(request-target): post ${path}`);
    lines.push(`date: ${headers.date}`);
    lines.push(`digest: ${headers.digest}`);
    const toSign = lines.join('\n');
    // sign string and compare with authorization header
    const signature = sign(toSign);
    return doesSignatureMatch(headers.authorization, signature);
};
const createMaskedCognitoIdentity = (identity) => {
    const cognitoIdentityHashSalt = config.get('cognitoIdentityHashSalt');
    return web3.utils.sha3(`${identity}${cognitoIdentityHashSalt}`);
};
module.exports = {
    sign,
    isWebhookValid,
    createCognitoHeaders,
    createMaskedCognitoIdentity
};
