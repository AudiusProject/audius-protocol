const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')

const config = require('../../src/config')
const { getApp } = require('../lib/app')

const {
  sendInstruction,
  createUserBankInstruction,
  garbageProgramInstructions,
  garbageCreateSenderInstructions,
  createSenderInstructions,
  withdrawSwapRelayRequest,
  unclosedTokenAccountInstructions
} = require('../lib/instructionMocks')
const relayHelpers = require('../../src/utils/relayHelpers')
const { isRelayAllowedProgram } = require('../../src/utils/relayUtils')
const { validateRelayInstructions, isSendInstruction } = relayHelpers

const solanaClaimableTokenProgramAddress = config.get(
  'solanaClaimableTokenProgramAddress'
)
const solanaRewardsManagerProgramId = config.get(
  'solanaRewardsManagerProgramId'
)

describe('Solana Relay checks', function () {
  it('knows the difference between claimable token transfers and creations', function () {
    assert(isSendInstruction(sendInstruction))
    assert(!isSendInstruction(createUserBankInstruction))
  })

  it('allows known program ids and rejects others', function () {
    assert(
      isRelayAllowedProgram([{ programId: solanaClaimableTokenProgramAddress }])
    )
    assert(
      isRelayAllowedProgram([{ programId: solanaRewardsManagerProgramId }])
    )

    assert(!isRelayAllowedProgram([{ programId: 'wrong' }]))
    assert(
      !isRelayAllowedProgram([
        { programId: solanaRewardsManagerProgramId },
        { programId: 'wrong' }
      ])
    )

    assert(isRelayAllowedProgram(sendInstruction))
    assert(isRelayAllowedProgram(createUserBankInstruction))
    assert(!isRelayAllowedProgram(garbageProgramInstructions))
  })

  it('allows valid createSender instructions', async function () {
    const invalidInstructions = await validateRelayInstructions(
      createSenderInstructions
    )
    assert(invalidInstructions.length === 0)
  })

  it('rejects createSender instructions with bad authority', async function () {
    const invalidInstructions = await validateRelayInstructions(
      garbageCreateSenderInstructions
    )
    assert(invalidInstructions.length > 0)
  })

  it('allows relaying withdraw swaps when authenticated', async function () {
    const invalidInstructions = await validateRelayInstructions(
      withdrawSwapRelayRequest.instructions,
      'some-wallet-address'
    )
    console.error(invalidInstructions)
    assert(invalidInstructions.length === 0)
  })

  it('rejects relaying withdraw swaps when not authenticated', async function () {
    const invalidInstructions = await validateRelayInstructions(
      withdrawSwapRelayRequest.instructions
    )
    assert(invalidInstructions.length > 0)
  })

  it("disallows creating token accounts that aren't closed", async function () {
    const invalidInstructions = await validateRelayInstructions(
      unclosedTokenAccountInstructions
    )
    assert(invalidInstructions.length > 0)
  })
})

describe('test Solana relay route without social verification', function () {
  let app, server, sandbox
  beforeEach(async () => {
    config.set('sentryDSN', '')
    sandbox = sinon.createSandbox()
    const appInfo = await getApp()
    app = appInfo.app
    server = appInfo.server
    sandbox.stub(relayHelpers, 'doesUserHaveSocialProof').resolves(false)
  })
  afterEach(async () => {
    sandbox.restore()
    await server.close()
  })

  it('responds 400 when relaying a send instruction without social verification', function (done) {
    request(app)
      .post('/solana/relay')
      .send({
        instructions: sendInstruction,
        skipPreflight: false,
        feePayerOverride: null
      })
      .expect(500, done)
  })
})
