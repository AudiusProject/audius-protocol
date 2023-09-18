"use strict";
const request = require('supertest');
const assert = require('assert');
const sinon = require('sinon');
const { getApp } = require('../lib/app');
const solClient = require('../../src/solana-client');
describe('test Solana listen tracking', function () {
    const TRACK_ID = 12345;
    const USER_ID = 54321;
    const TRACKING_LISTEN_SUBMISSION_KEY = 'listens-tx-submission-ts';
    const TRACKING_LISTEN_SUCCESS_KEY = 'listens-tx-success-ts';
    let app, server, sandbox, solanaWeb3Stub, createTrackListenInstructions;
    beforeEach(async () => {
        delete require.cache[require.resolve('../../src/routes/trackListens')];
        sandbox = sinon.createSandbox();
        createTrackListenInstructions = sandbox.stub(solClient, 'createTrackListenInstructions');
        const appInfo = await getApp();
        app = appInfo.app;
        server = appInfo.server;
        solanaWeb3Stub = sandbox.stub();
        app.get('audiusLibs').solanaWeb3Manager.solanaWeb3 = solanaWeb3Stub;
        app.get('audiusLibs').solanaWeb3Manager.transactionHandler = {
            handleTransaction: function () { return Promise.resolve('ok'); }
        };
        await app.get('redis').flushdb();
    });
    afterEach(async () => {
        sandbox.restore();
        await server.close();
    });
    const recordSuccessfulListen = async (raw) => {
        // Common to both raw and non-raw path
        createTrackListenInstructions.resolves('expected success');
        const resp = await request(app)
            .post(`/tracks/${TRACK_ID}/listen`)
            .send({
            userId: USER_ID,
            solanaListen: true,
            sendRawTransaction: raw
        });
        assert.strictEqual(resp.status, 200);
    };
    const recordFailedListen = async (raw) => {
        // Failed listen just needs createTrackListenInstructions to fail because it's called before raw/non-raw logic
        createTrackListenInstructions.rejects('intentional failure');
        const resp = await request(app)
            .post(`/tracks/${TRACK_ID}/listen`)
            .send({
            userId: USER_ID,
            solanaListen: true,
            sendRawTransaction: raw
        });
        assert.strictEqual(resp.status, 500);
    };
    const verifySuccessfulListens = async (numSuccess, numSubmission, percentSuccess, threshold) => {
        const resp = await request(app)
            .get(`/tracks/listen/solana/status?percent=${threshold}`)
            .send();
        assert.strictEqual(resp.status, 200);
        assert.match(resp.headers['content-type'], /json/);
        const status = resp.body;
        assert.strictEqual(status.totalSuccessCount, numSuccess);
        assert.strictEqual(status.totalSubmissionCount, numSubmission);
        assert.strictEqual(status.totalPercentSuccess, percentSuccess);
    };
    const verifyFailedListens = async (threshold) => {
        const resp = await request(app)
            .get(`/tracks/listen/solana/status?percent=${threshold}`)
            .send();
        assert.strictEqual(resp.status, 400);
    };
    const verifyListensInRange = async (range, listens, listensInRange) => {
        const resp = await request(app)
            .get(`/tracks/listen/solana/status?cutoffMinutes=${range}`)
            .send();
        assert.strictEqual(resp.status, 200);
        assert.match(resp.headers['content-type'], /json/);
        const status = resp.body;
        assert.strictEqual(status.totalSuccessCount, listens);
        assert.strictEqual(status.totalSubmissionCount, listens);
        assert.strictEqual(status.recentInfo.recentSuccessCount, listensInRange);
        assert.strictEqual(status.recentInfo.recentSubmissionCount, listensInRange);
        assert.strictEqual(status.totalPercentSuccess, 1);
    };
    const delaySeconds = async (seconds) => {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    };
    for (const raw of [true, false]) {
        const pathText = `for ${raw ? 'sendRawTransaction' : 'sendAndConfirmTransaction'} path`;
        it(`records successful and failed transactions and fails when threshold is not met ${pathText}`, async function () {
            await recordSuccessfulListen();
            await recordFailedListen();
            await verifySuccessfulListens(1, 2, 0.5, 0.5);
            await verifyFailedListens(0.51);
        });
        it(`only counts listens in the given time range ${pathText}`, async function () {
            const twoSecondsInMinutes = 2 / 60;
            const fourSecondsInMinutes = 4 / 60;
            const listensInLastTwoSeconds = 1;
            const listensInLastFourSeconds = 2;
            await recordSuccessfulListen();
            await delaySeconds(3);
            await recordSuccessfulListen();
            await verifyListensInRange(twoSecondsInMinutes, 2, listensInLastTwoSeconds);
            await verifyListensInRange(fourSecondsInMinutes, 2, listensInLastFourSeconds);
        });
        it(`expires only listens greater than 1 week ${pathText}`, async function () {
            const now = Date.now();
            const lastWeek = now - (24 * 60 * 60 * 1000 * 7 + 1);
            const redis = app.get('redis');
            await redis.zadd(TRACKING_LISTEN_SUCCESS_KEY, now, now);
            await redis.zadd(TRACKING_LISTEN_SUBMISSION_KEY, now, now);
            await redis.zadd(TRACKING_LISTEN_SUCCESS_KEY, lastWeek, lastWeek);
            await redis.zadd(TRACKING_LISTEN_SUBMISSION_KEY, lastWeek, lastWeek);
            const successBeforeCleanup = await redis.zcount(TRACKING_LISTEN_SUCCESS_KEY, 0, Number.MAX_SAFE_INTEGER);
            assert.strictEqual(successBeforeCleanup, 2);
            await verifySuccessfulListens(1, 1, 1, 1);
        });
        it(`counts 0 submissions as 100% success ${pathText}`, async function () {
            await verifySuccessfulListens(0, 0, 1, 1);
            await recordFailedListen();
            await verifyFailedListens(0.1);
        });
    }
});
