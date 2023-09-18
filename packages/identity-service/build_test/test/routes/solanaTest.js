"use strict";
const request = require('supertest');
const assert = require('assert');
const sinon = require('sinon');
const config = require('../../src/config');
const { getApp } = require('../lib/app');
const { sendInstruction, createUserBankInstruction, garbageProgramInstructions, garbageCreateSenderInstructions, createSenderInstructions } = require('../lib/instructionMocks');
const relayHelpers = require('../../src/utils/relayHelpers');
const solanaClaimableTokenProgramAddress = config.get('solanaClaimableTokenProgramAddress');
const solanaRewardsManagerProgramId = config.get('solanaRewardsManagerProgramId');
describe('test Solana util functions', function () {
    it('isSendInstruction', function () {
        assert(relayHelpers.isSendInstruction(sendInstruction));
        assert(!relayHelpers.isSendInstruction(createUserBankInstruction));
    });
    it('isRelayAllowedProgram', function () {
        assert(relayHelpers.isRelayAllowedProgram([{ programId: solanaClaimableTokenProgramAddress }]));
        assert(relayHelpers.isRelayAllowedProgram([{ programId: solanaRewardsManagerProgramId }]));
        assert(!relayHelpers.isRelayAllowedProgram([{ programId: 'wrong' }]));
        assert(!relayHelpers.isRelayAllowedProgram([{ programId: solanaRewardsManagerProgramId }, { programId: 'wrong' }]));
        assert(relayHelpers.isRelayAllowedProgram(sendInstruction));
        assert(relayHelpers.isRelayAllowedProgram(createUserBankInstruction));
        assert(!relayHelpers.isRelayAllowedProgram(garbageProgramInstructions));
    });
    it('isRelayAlllowedInstruction', async function () {
        assert(await relayHelpers.areRelayAllowedInstructions(createSenderInstructions));
        assert(!(await relayHelpers.areRelayAllowedInstructions(garbageCreateSenderInstructions)));
    });
});
describe('test Solana relay route without social verification', function () {
    let app, server, sandbox;
    beforeEach(async () => {
        config.set('sentryDSN', '');
        sandbox = sinon.createSandbox();
        const appInfo = await getApp();
        app = appInfo.app;
        server = appInfo.server;
        sandbox.stub(relayHelpers, 'doesUserHaveSocialProof').resolves(false);
    });
    afterEach(async () => {
        sandbox.restore();
        await server.close();
    });
    it('responds 400 when relaying a send instruction without social verification', function (done) {
        request(app)
            .post('/solana/relay')
            .send({
            instructions: sendInstruction,
            skipPreflight: false,
            feePayerOverride: null
        })
            .expect(500, done);
    });
});
