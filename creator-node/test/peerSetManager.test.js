const assert = require('assert')

const PeerSetManager = require('../src/snapbackSM/peerSetManager')

describe('test peerSetManager()', () => {
  const peerSetManager = new PeerSetManager({
    discoveryProviderEndpoint: 'https://discovery_endpoint.audius.co',
    creatorNodeEndpoint: 'https://content_node_endpoint.audius.co'
  })

  const baseVerboseHealthCheckResp = {
    version: '0.3.37',
    service: 'content-node',
    healthy: true,
    git: '',
    selectedDiscoveryProvider: 'http://audius-disc-prov_web-server_1:5000',
    creatorNodeEndpoint: 'http://cn1_creator-node_1:4000',
    spID: 1,
    spOwnerWallet: '0xf7316fe994bb92556dcfd998038618ce1227aeea',
    sRegisteredOnURSM: true,
    country: 'US',
    latitude: '41.2619',
    longitude: '-95.8608',
    databaseConnections: 5,
    databaseSize: 8956927,
    usedTCPMemory: 166,
    receivedBytesPerSec: 756.3444159135626,
    transferredBytesPerSec: 186363.63636363638,
    maxStorageUsedPercent: 95,
    numberOfCPUs: 12,
    latestSyncSuccessTimestamp: '2021-06-08T21:29:34.231Z',
    latestSyncFailTimestamp: '',

    // Fields to consider in this test
    thirtyDayRollingSyncSuccessCount: 50,
    thirtyDayRollingSyncFailCount: 10,
    dailySyncSuccessCount: 5,
    dailySyncFailCount: 0,
    totalMemory: 25219547136,
    usedMemory: 16559153152,
    maxFileDescriptors: 9223372036854776000,
    allocatedFileDescriptors: 15456,
    storagePathSize: 259975987200,
    storagePathUsed: 59253436416
  }

  it('should throw error if storage path vars are improper', () => {
    let verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.storagePathSize
    delete verboseHealthCheckResp.storagePathUsed

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail('Should not have considered storage criteria if vars are not present')
    }

    // In bytes
    verboseHealthCheckResp.storagePathSize = 200000000000
    verboseHealthCheckResp.storagePathUsed = 190000000000

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail('Should not have passed without meeting minimum storage requirements')
    } catch (e) {
      assert.ok(e.message.includes('storage'))
    }
  })

  it('should throw error if memory vars are improper', () => {
    let verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.usedMemory
    delete verboseHealthCheckResp.totalMemory

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      // Swallow error
      assert.fail('Should not have considered memory criteria if vars are not present')
    }

    // In bytes
    verboseHealthCheckResp.usedMemory = 6000000001
    verboseHealthCheckResp.totalMemory = 12000000000

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail('Should not have passed without meeting minimum memory requirements')
    } catch (e) {
      assert.ok(e.message.includes('memory'))
    }
  })

  it('should throw error if the file descriptors are improper', () => {
    let verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.allocatedFileDescriptors
    delete verboseHealthCheckResp.maxFileDescriptors

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail('Should not have considered file descriptors if vars are not present')
    }

    verboseHealthCheckResp.allocatedFileDescriptors = 1000
    verboseHealthCheckResp.maxFileDescriptors = 1001

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail('Should not have passed when surpassing file descriptors open threshold')
    } catch (e) {
      assert.ok(e.message.includes('file descriptors'))
    }
  })

  it('should throw error if latest sync history vars are improper', () => {
    let verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.dailySyncSuccessCount
    delete verboseHealthCheckResp.dailySyncFailCount

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail('Should not have considered latest sync history if vars are not present')
    }

    verboseHealthCheckResp.dailySyncSuccessCount = 2
    verboseHealthCheckResp.dailySyncFailCount = 1

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail('Should not have considered latest sync history if mininum count not met')
    }

    verboseHealthCheckResp.dailySyncSuccessCount = 5
    verboseHealthCheckResp.dailySyncFailCount = 55

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail('Should not have passed when fail count percentage is greater than success count')
    } catch (e) {
      assert.ok(e.message.includes('sync data'))
    }
  })

  it('should throw error if rolling sync history vars are improper', () => {
    let verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.thirtyDayRollingSyncSuccessCount
    delete verboseHealthCheckResp.thirtyDayRollingSyncFailCount

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail('Should not have considered rolling sync history if vars are not present')
    }

    verboseHealthCheckResp.thirtyDayRollingSyncSuccessCount = 5
    verboseHealthCheckResp.thirtyDayRollingSyncFailCount = 1

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail('Should not have considered rolling sync history if mininum count not met')
    }

    verboseHealthCheckResp.thirtyDayRollingSyncSuccessCount = 1
    verboseHealthCheckResp.thirtyDayRollingSyncFailCount = 5000

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail('Should not have passed when fail count percentage is greater than success count')
    } catch (e) {
      assert.ok(e.message.includes('sync data'))
    }
  })

  it('should pass if verbose health check resp is proper', () => {
    try {
      peerSetManager.determinePeerHealth(baseVerboseHealthCheckResp)
    } catch (e) {
      assert.fail(`Should have succeeded: ${e.toString()}`)
    }
  })
})
