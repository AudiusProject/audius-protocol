const assert = require('assert')
const proxyquire = require('proxyquire')

const {
  SyncMode,
  computeSyncModeForUserAndReplica
} = require('./computeSyncModeForUserAndReplica.js')
describe.only('Test computeSyncModeForUserAndReplica()', () => {
  let primaryClock, secondaryClock, primaryFilesHash, secondaryFilesHash

  // Can be anything for test purposes
  const wallet = 'wallet'

  it('Throws if missing or invalid params', async () => {
    primaryClock = 10
    secondaryClock = 10
    primaryFilesHash = undefined
    secondaryFilesHash = undefined

    try {
      await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })
    } catch (e) {
      assert.strictEqual(e.message, '[computeSyncModeForUserAndReplica] Error: Missing or invalid params')
    }
  })

  it('Returns SyncMode.None if all data is equal', async () => {
    primaryClock = 10
    secondaryClock = primaryClock
    primaryFilesHash = '0x123'
    secondaryFilesHash = primaryFilesHash

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SyncMode.None)
  })

  it('Returns SyncMode.None if clocks and filesHashes equal', async () => {
    primaryClock = 10
    secondaryClock = primaryClock
    primaryFilesHash = '0x123'
    secondaryFilesHash = primaryFilesHash

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SyncMode.None)
  })

  it('Returns SyncMode.PrimaryShouldSync if clocks equal and filesHashes unequal', async () => {
    primaryClock = 10
    secondaryClock = primaryClock
    primaryFilesHash = '0x123'
    secondaryFilesHash = '0x456'

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SyncMode.PrimaryShouldSync)
  })

  it('Returns SyncMode.PrimaryShouldSync if clocks equal and filesHashes unequal', async () => {
    primaryClock = 10
    secondaryClock = primaryClock
    primaryFilesHash = '0x123'
    secondaryFilesHash = '0x456'

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SyncMode.PrimaryShouldSync)
  })

  it('Returns SyncMode.PrimaryShouldSync if primaryClock < secondaryClock', async () => {
    primaryClock = 5
    secondaryClock = 10
    primaryFilesHash = '0x123'
    secondaryFilesHash = '0x456'

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SyncMode.PrimaryShouldSync)
  })

  it('Returns SyncMode.SecondaryShouldSync if primaryClock > secondaryClock & secondaryFilesHash === null', async () => {
    primaryClock = 10
    secondaryClock = 5
    primaryFilesHash = '0x123'
    secondaryFilesHash = null

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SyncMode.SecondaryShouldSync)
  })

  describe('primaryClock > secondaryClock', () => {
    it('Returns SyncMode.SecondaryShouldSync if primaryFilesHashForRange = secondaryFilesHash', async () => {
      const dbManagerMock = {}
      proxyquire('')
    })

    it.skip('Returns SyncMode.PrimaryShouldSync if primaryFilesHashForRange != secondaryFilesHash')

    it.skip('Returns SyncMode.None if primaryFilesHashForRange can\'t be retrieved')
  })
})
