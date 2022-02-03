const assert = require('assert')
const { AttestationDelayCalculator } = require('../src/services/solanaWeb3Manager/rewardsAttester')

function MockLibs (getSlot, getBlockNumber) {
  this.getSlot = getSlot
  this.getBlockNumber = getBlockNumber
  this.solanaWeb3Manager = {
      getSlot: () => this.getSlot()
  }
  this.web3Manager = {
      getWeb3: () => ({
        eth: {
          getBlockNumber: () => this.getBlockNumber()
        }
      })
    }
}

describe('Delay calculator tests', () => {
  it('Should get Slot and block threshold on fresh start', async () => {
    const calc = new AttestationDelayCalculator({
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
    const calc = new AttestationDelayCalculator({
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
    const calc = new AttestationDelayCalculator({
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

    const calc = new AttestationDelayCalculator({
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
    calc.stop()
  })
})