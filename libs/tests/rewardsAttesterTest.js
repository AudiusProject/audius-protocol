const assert = require('assert')
const sinon = require('sinon')
const RewardsAttester  = require('../src/services/solanaWeb3Manager/rewardsAttester')

const { AttestationDelayCalculator } = RewardsAttester

function MockLibs (getSlot = () => 100, getBlockNumber = () => 100) {
  this.getSlot = getSlot
  this.getBlockNumber = getBlockNumber
  this.solanaWeb3Manager = {
      getSlot: () => this.getSlot(),
      hasBalance: ({ publicKey}) => true,
  }
  this.web3Manager = {
      getWeb3: () => ({
        eth: {
          getBlockNumber: () => this.getBlockNumber()
        }
      })
    }
  this.Rewards = {
    submitAndEvaluate: (args) => {},
    getUndisbursedChallenges: (args) => {},
    ServiceProvider: {
      getUniquelyOwnedDiscoveryNodes: (quorumSize, nodes) => {
        return nodes.slice(0, quorumSize)
      }
    }
  }
  this.discoveryProvider = {
    serviceSelector: {
      findAll: ({ whitelist }) => {
        return whitelist
      }
    }
  }
}

let calc = null

describe('Delay calculator tests', () => {
  afterEach(async () => {
    calc.stop()
  })

  it('Should get Slot and block threshold on fresh start', async () => {
    calc = new AttestationDelayCalculator({
      libs: new MockLibs(() => 100, () => 100),
      runBehindSec: 5,
      allowedStalenessSec: 1
    })
    await calc.start()
    const slotThreshold = await calc.getSolanaSlotThreshold()
    // Should be 90: 100 - 5 / 0.5 block/sec
    assert.strictEqual(slotThreshold, 90)

    const blockThreshold = await calc.getPOABlockThreshold()
    // Should be 99: 100 - 5 / 5
    assert.strictEqual(blockThreshold, 99)
  })

  it('Should cache slot and block values', async () => {
    const libs = new MockLibs(() => 100, () => 100)
    calc = new AttestationDelayCalculator({
      libs,
      runBehindSec: 5,
      allowedStalenessSec: 1
    })
    await calc.start()
    await calc.getSolanaSlotThreshold()
    await calc.getPOABlockThreshold()

    // Test cached values
    libs.getSlot = () => 110
    libs.getBlockNumber = () => 110
    const slotThreshold = await calc.getSolanaSlotThreshold()
    assert.strictEqual(slotThreshold, 90)
    const blockThreshold = await calc.getPOABlockThreshold()
    assert.strictEqual(blockThreshold, 99)
  })

  it('Should get new values after the cache expires', async () => {
    const libs = new MockLibs(() => 100, () => 100)
    calc = new AttestationDelayCalculator({
      libs,
      runBehindSec: 5,
      allowedStalenessSec: 1
    })
    await calc.start()
    await calc.getSolanaSlotThreshold()
    await calc.getPOABlockThreshold()

    // Test cached values
    await new Promise(res => setTimeout(res, 1100))
    libs.getSlot = () => 110
    libs.getBlockNumber = () => 110
    const slotThreshold = await calc.getSolanaSlotThreshold()
    assert.strictEqual(slotThreshold, 100)
    const blockThreshold = await calc.getPOABlockThreshold()
    assert.strictEqual(blockThreshold, 109)
  })

  it('Should update the solana slot properly', async () => {
    const solSlot = {
      last: 100
    }
    // new slots every 250ms
    const i = setInterval(() => {
      solSlot.last += 1
    }, 250)

    const libs = new MockLibs(() => solSlot.last, () => 100)

    calc = new AttestationDelayCalculator({
      libs,
      runBehindSec: 5,
      allowedStalenessSec: 1,
      solanaPollingInterval: 0.5
    })
    calc.start()
    const slotThreshold1 = await calc.getSolanaSlotThreshold()
    // Initially this should be 0.5sec/slot
    assert.strictEqual(slotThreshold1, 90)

    // Wait for staleness interval
    await new Promise(res => setTimeout(res, 1100))
    const slotThreshold2 = await calc.getSolanaSlotThreshold()
    // Current slot should be 104, and there should be 4 slots/sec,
    // so 5 sec lag behind = 104 - 5 * 4 = 84
    assert.strictEqual(slotThreshold2, 84)

    clearInterval(i)
  })
})

describe('Rewards Attester Tests', () => {
  afterEach(async () => {
    sinon.restore()
  })

  it('Should handle happy path attestation loop', async () => {
    const libs = new MockLibs()

    const attester = new RewardsAttester({
      libs,
      startingBlock: 0,
      offset: 0,
      parallelization: 2,
      quorumSize: 2,
      aaoEndpoint: 'https://fakeaao.co',
      aaoAddress: '0xFakeOracle',
      challengeIdsDenyList: [],
      endpoints: ['https://dn1.co', 'https://dn2.co', 'https://dn3.co'],
      isSolanaChallenge: () => false
    })

    const rewardsMock = sinon.mock(libs.Rewards)

    rewardsMock.expects("getUndisbursedChallenges")
      .exactly(3)
      .onFirstCall()
      .returns({
        success: [
          {
            challenge_id: "profile-completion",
            user_id: "7eP5n",
            specifier: "1",
            amount: "1",
            completed_blocknumber: 1,
            handle: "firstUser",
            wallet: "0xFirstUser"
          },
          {
            challenge_id: "profile-completion",
            user_id: "ML51L",
            specifier: "2",
            amount: "1",
            completed_blocknumber: 2,
            handle: "secondUser",
            wallet: "0xSecondUser"
          }
        ]
      })
      .onSecondCall()
      .returns({
        success: [
          {
            challenge_id: "profile-completion",
            user_id: "lebQD",
            specifier: "3",
            amount: "1",
            completed_blocknumber: 3,
            handle: "thirdUser",
            wallet: "0xThirdUser"
          },
          {
            challenge_id: "profile-completion",
            user_id: "ELKzn",
            specifier: "4",
            amount: "1",
            completed_blocknumber: 4,
            handle: "fourthUser",
            wallet: "0xFouthUser"
          }
        ]
      })
      .onThirdCall()
      .callsFake(() => {
        attester.stop()
        return {
          success: []
        }
      })

    rewardsMock.expects("submitAndEvaluate")
      .exactly(4)
      .returns({ success: true })


    await attester.start()
    assert.equal(attester.startingBlock, 3)
    assert.equal(attester.offset, 0)
    rewardsMock.verify()
  })
})