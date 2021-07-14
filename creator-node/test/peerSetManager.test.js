const assert = require('assert')

const PeerSetManager = require('../src/snapbackSM/peerSetManager')

describe('test peerSetManager', () => {
  let peerSetManager

  const primaryEndpoint = 'http://primary.audius.co'

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

  beforeEach(() => {
    peerSetManager = new PeerSetManager({
      discoveryProviderEndpoint: 'https://discovery_endpoint.audius.co',
      creatorNodeEndpoint: 'https://content_node_endpoint.audius.co'
    })
  })

  it('[determinePeerHealth] should throw error if storage path vars are improper', () => {
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

  it('[determinePeerHealth] should throw error if memory vars are improper', () => {
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

  it('[determinePeerHealth] should throw error if the file descriptors are improper', () => {
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

  it('[determinePeerHealth] should throw error if latest sync history vars are improper', () => {
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

  it('[determinePeerHealth] should throw error if rolling sync history vars are improper', () => {
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

  it('[determinePeerHealth] should pass if verbose health check resp is proper', () => {
    try {
      peerSetManager.determinePeerHealth(baseVerboseHealthCheckResp)
    } catch (e) {
      assert.fail(`Should have succeeded: ${e.toString()}`)
    }
  })

  it('[isPrimaryHealthy] should mark primary as healthy if responds with 200 from health check', async () => {
    // Mock method
    peerSetManager.isNodeHealthy = async () => { return true }

    const isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], undefined)
  })

  it('[isPrimaryHealthy] should mark primary as healthy if responds with 500 from health check and has not been visited yet', async () => {
    // Mock method
    peerSetManager.isNodeHealthy = async () => { return false }

    const isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], 1)
  })

  it('[isPrimaryHealthy] should mark primary as unhealthy if responds with 500 from health check and has been visited the max number of times', async () => {
    // Mock method
    peerSetManager.isNodeHealthy = async () => { return false }

    let isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], 1)

    isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], 2)

    let i = 0
    // If this number if greater than the max, the counter stops at the max
    const numTimesUnhealthy = 14
    while (i++ < numTimesUnhealthy) {
      isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)
    }

    assert.strictEqual(isHealthy, false)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], 10)
  })

  it('[isPrimaryHealthy] removes primary from map if it goes from unhealthy and back to healthy', async () => {
    // Mock method
    peerSetManager.isNodeHealthy = async () => { return false }

    let isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], 1)

    //  Mock again
    peerSetManager.isNodeHealthy = async () => { return true }

    isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(peerSetManager.primaryToNumberFailedHealthChecksPerformed[primaryEndpoint], undefined)
  })
})
