const nock = require('nock')
const assert = require('assert')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const proxyquire = require('proxyquire')

const models = require('../src/models')
const { getLibsMock } = require('./lib/libsMock')
const { SnapbackSM, SyncType, RECONFIG_MODES } = require('../src/snapbackSM/snapbackSM')
const utils = require('../src/utils')
const { getApp } = require('./lib/app')
const nodeConfig = require('../src/config')
const SecondarySyncHealthTracker = require('../src/snapbackSM/secondarySyncHealthTracker')

const { expect } = chai
chai.use(sinonChai)

describe('test SnapbackSM -- determineNewReplicaSet, sync queue, and reconfig mode', function () {
  const constants = {
    primaryEndpoint: 'http://test_cn_primary.co',
    secondary1Endpoint: 'http://test_cn_secondary1.co',
    secondary2Endpoint: 'http://test_cn_secondary2.co',
    healthyNode1Endpoint: 'http://healthy1_cn.co',
    healthyNode2Endpoint: 'http://healthy2_cn.co',
    healthyNode3Endpoint: 'http://healthy3_cn.co',
    primaryClockVal: 1,
    wallet: '0x4749a62b82983fdcf19ce328ef2a7f7ec8915fe5',
    userId: 1
  }
  
  const replicaSetNodesToUserClockStatusesMap = {}
  replicaSetNodesToUserClockStatusesMap[constants.primaryEndpoint] = {}
  replicaSetNodesToUserClockStatusesMap[constants.primaryEndpoint][constants.wallet] = 10
  replicaSetNodesToUserClockStatusesMap[constants.secondary1Endpoint] = {}
  replicaSetNodesToUserClockStatusesMap[constants.secondary1Endpoint][constants.wallet] = 10
  replicaSetNodesToUserClockStatusesMap[constants.secondary2Endpoint] = {}
  replicaSetNodesToUserClockStatusesMap[constants.secondary2Endpoint][constants.wallet] = 10
  
  const healthCheckVerboseResponse = {
    'version': '0.3.38',
    'service': 'content-node',
    'healthy': true,
    'git': '',
    'selectedDiscoveryProvider': 'http://dn1_web-server_1:5000',
    'creatorNodeEndpoint': 'http://cn1_creator-node_1:4000',
    'spID': 1,
    'spOwnerWallet': '0x18a1a15f7b63f48532233ee3dd6de4f48f0c35f3',
    'isRegisteredOnURSM': true,
    'country': 'US',
    'latitude': '41.2619',
    'longitude': '-95.8608',
    'databaseConnections': 5,
    'databaseSize': 9137151,
    'totalMemory': 25219547136,
    'usedMemory': 7504482304,
    'usedTCPMemory': 244,
    'storagePathSize': 259975987200,
    'storagePathUsed': 66959749120,
    'maxFileDescriptors': 9223372036854776000,
    'allocatedFileDescriptors': 13984,
    'receivedBytesPerSec': 12910.976260336089,
    'transferredBytesPerSec': 163500,
    'maxStorageUsedPercent': 95,
    'numberOfCPUs': 12,
    'thirtyDayRollingSyncSuccessCount': 7,
    'thirtyDayRollingSyncFailCount': 0,
    'dailySyncSuccessCount': 0,
    'dailySyncFailCount': 0,
    'latestSyncSuccessTimestamp': '',
    'latestSyncFailTimestamp': ''
  }
  
  const healthyNodes = [constants.healthyNode1Endpoint, constants.healthyNode2Endpoint, constants.healthyNode3Endpoint]
  
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
    nock.disableNetConnect()
  })

  afterEach(async function () {
    await server.close()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('Manual and recurring syncs are processed correctly', async function () {
    const NodeResponseDelayMs = 500

    const NumManualSyncsToAdd = 3
    const NumRecurringSyncsToAdd = 5

    // Set max concurrency values to lower than the number of jobs added to test queue
    const MaxManualRequestSyncJobConcurrency = 3
    const MaxRecurringRequestSyncJobConcurrency = 1
    nodeConfig.set('maxManualRequestSyncJobConcurrency', MaxManualRequestSyncJobConcurrency)
    nodeConfig.set('maxRecurringRequestSyncJobConcurrency', MaxRecurringRequestSyncJobConcurrency)
    nodeConfig.set('disableSnapback', false)

    // Mock out the initial call to sync
    nock(constants.secondary1Endpoint)
      .persist()
      .post(() => true)
      .reply(200)

    // Mock out the secondary monitoring response with a 500ms delay
    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .delayBody(NodeResponseDelayMs)
      .reply(200, { data: { clockValue: constants.primaryClockVal } })

    // Create CNodeUsers to use trigger syncs for
    for (let i = 0; i <= NumManualSyncsToAdd; i++) {
      await models.CNodeUser.create({
        walletPublicKey: `user_wallet_${i}`,
        clock: constants.primaryClockVal
      })
    }

    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `getLatestUserId` to return userId=0
    snapback.getLatestUserId = async () => { return 0 }
    
    await snapback.init()

    // Enqueue recurring requestSync jobs
    const recurringSyncIds = []
    for (let i = 0; i < NumRecurringSyncsToAdd; i++) {
      const { id } = await snapback.enqueueSync({
        userWallet: `user_wallet_${i}`,
        secondaryEndpoint: constants.secondary1Endpoint,
        primaryEndpoint: constants.primaryEndpoint,
        syncType: SyncType.Recurring
      })
      recurringSyncIds.push(id)
    }
    assert.strictEqual(recurringSyncIds.length, NumRecurringSyncsToAdd, `Failed to add ${NumRecurringSyncsToAdd} recurring syncs`)

    // Assert on range instead of strict value due to non-deterministic timing (by design)
    let syncQueueJobs = await snapback.getSyncQueueJobs()
    assert.ok(syncQueueJobs.recurringActive.length <= MaxRecurringRequestSyncJobConcurrency)
    assert.ok(syncQueueJobs.recurringWaiting.length >= NumRecurringSyncsToAdd - MaxRecurringRequestSyncJobConcurrency)

    // Enqueue manual requestSync jobs
    const manualSyncIds = []
    for (let i = 0; i < NumManualSyncsToAdd; i++) {
      const { id } = await snapback.enqueueSync({
        userWallet: `user_wallet_${i}`,
        secondaryEndpoint: constants.secondary1Endpoint,
        primaryEndpoint: constants.primaryEndpoint,
        syncType: SyncType.Manual
      })
      manualSyncIds.push(id)
    }
    assert.strictEqual(manualSyncIds.length, NumManualSyncsToAdd, `Failed to add ${NumManualSyncsToAdd} manual syncs`)

    // Assert on range instead of strict value due to non-deterministic timing (by design)
    syncQueueJobs = await snapback.getSyncQueueJobs()
    assert.ok(syncQueueJobs.manualActive.length <= MaxManualRequestSyncJobConcurrency)
    assert.ok(syncQueueJobs.manualWaiting.length >= NumManualSyncsToAdd - MaxManualRequestSyncJobConcurrency)

    const totalJobsAddedCount = recurringSyncIds.length + manualSyncIds.length

    syncQueueJobs = await snapback.getSyncQueueJobs()
    let [
      manualWaitingJobIDs,
      recurringWaitingJobIDs
    ] = [
      syncQueueJobs.manualWaiting.map(job => job.id),
      syncQueueJobs.recurringWaiting.map(job => job.id)
    ]

    // Keep polling until no waiting jobs remaining
    // Set polling timeout to (2 * totalJobsAddedCount * NodeResponseDelayMs) to ensure jobs are being processed in a timely manner
    let totalPollingTime = 0
    while (manualWaitingJobIDs.length || recurringWaitingJobIDs.length) {
      console.log(`Num manualWaitingJobIDs: ${manualWaitingJobIDs.length} || Num recurringWaitingJobIDs: ${recurringWaitingJobIDs.length}`)

      await utils.timeout(NodeResponseDelayMs)

      totalPollingTime += NodeResponseDelayMs
      if (totalPollingTime > (2 * totalJobsAddedCount * NodeResponseDelayMs)) {
        throw new Error('Snapback failed to process sync queue jobs in a timely manner')
      }

      syncQueueJobs = await snapback.getSyncQueueJobs(true);
      [
        manualWaitingJobIDs,
        recurringWaitingJobIDs
      ] = [
        syncQueueJobs.manualWaiting.map(job => job.id),
        syncQueueJobs.recurringWaiting.map(job => job.id)
      ]

      // Assert that active jobs queue size never exceeds configured max concurrency
      assert.ok(syncQueueJobs.manualActive.length <= MaxManualRequestSyncJobConcurrency)
      assert.ok(syncQueueJobs.recurringActive.length <= MaxRecurringRequestSyncJobConcurrency)
    }

    assert.strictEqual(manualWaitingJobIDs.length, 0)
    assert.strictEqual(recurringWaitingJobIDs.length, 0)
  })

  it('depending on the reconfig mode enabled, reflect changes in the enabled modes', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)
    let snapback = new SnapbackSM(nodeConfig, getLibsMock())

    assert.strictEqual(snapback.highestEnabledReconfigMode, RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))

    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.MULTIPLE_SECONDARIES.key)
    snapback = new SnapbackSM(nodeConfig, getLibsMock())

    assert.strictEqual(snapback.highestEnabledReconfigMode, RECONFIG_MODES.MULTIPLE_SECONDARIES.key)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))

    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.ONE_SECONDARY.key)
    snapback = new SnapbackSM(nodeConfig, getLibsMock())

    assert.strictEqual(snapback.highestEnabledReconfigMode, RECONFIG_MODES.ONE_SECONDARY.key)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))

    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.RECONFIG_DISABLED.key)
    snapback = new SnapbackSM(nodeConfig, getLibsMock())

    assert.strictEqual(snapback.highestEnabledReconfigMode, RECONFIG_MODES.RECONFIG_DISABLED.key)
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))
  })

  it('if config has an unrecognizable mode, default to `RECONFIG_DISABLED`', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', 'pizza')

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    assert.strictEqual(snapback.highestEnabledReconfigMode, RECONFIG_MODES.RECONFIG_DISABLED.key)
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.RECONFIG_DISABLED.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))
  })

  it('if the mode enabled does not cover the reconfig type, do not issue reconfig', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.RECONFIG_DISABLED.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint, constants.secondary1Endpoint]),
      healthyNodes,
      replicaSetNodesToUserClockStatusesMap
    })

    // Check to make sure that the new replica set is what we expect it to be
    expect(newPrimary).to.equal(constants.secondary2Endpoint)
    expect(healthyNodes).to.include(newSecondary1)
    expect(healthyNodes).to.include(newSecondary2)
    expect(issueReconfig).to.be.false
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.RECONFIG_DISABLED.key)).to.be.false
  })

  it('if entire replica set is unhealthy, return falsy replica set', async function () {
    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    // Pass in size 3 of `unhealthyReplicasSet`
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint, constants.secondary1Endpoint, constants.secondary2Endpoint]),
      healthyNodes,
      replicaSetNodesToUserClockStatusesMap
    })

    // Check to make sure that the return is falsy
    expect(newPrimary).to.be.null
    expect(newSecondary1).to.be.null
    expect(newSecondary2).to.be.null
    expect(issueReconfig).to.be.false
  })

  it('if one secondary is unhealthy, return new secondary', async function () {
    // Set `snapbackHighestReconfigMode` to 'ONE_SECONDARY'
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.ONE_SECONDARY.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    // Pass in size 1 of `unhealthyReplicasSet`
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.secondary2Endpoint]),
      healthyNodes,
      replicaSetNodesToUserClockStatusesMap
    })

    // Check to make sure that the new replica set is what we expect it to be
    // Primary is the same, secondary1 is the same, secondary2 is replaced
    expect(newPrimary).to.equal(constants.primaryEndpoint)
    expect(newSecondary1).to.equal(constants.secondary1Endpoint)
    expect(healthyNodes).to.include(newSecondary2)
    expect(issueReconfig).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key)).to.be.true
  })

  it('if both secondaries are unhealthy, return two new secondaries ', async function () {
    // Set `snapbackHighestReconfigMode` to 'MULTIPLE_SECONDARIES'
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.MULTIPLE_SECONDARIES.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    // Pass in size 1 of `unhealthyReplicasSet`
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.secondary1Endpoint, constants.secondary2Endpoint]),
      healthyNodes,
      replicaSetNodesToUserClockStatusesMap
    })

    // Check to make sure that the new replica set is what we expect it to be
    // Primary is the same, secondary1 and secondary2 are replaced
    expect(newPrimary).to.equal(constants.primaryEndpoint)
    expect(healthyNodes).to.include(newSecondary1)
    expect(healthyNodes).to.include(newSecondary2)
    expect(issueReconfig).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key)).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key)).to.be.true
  })

  it('if one primary is unhealthy, return a secondary promoted to primary, existing secondary1, and new secondary2', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    // Pass in size 1 of `unhealthyReplicasSet`
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint]),
      healthyNodes,
      replicaSetNodesToUserClockStatusesMap
    })

    // Check to make sure that the new replica set is what we expect it to be
    expect(newPrimary).to.equal(constants.secondary1Endpoint)
    expect(newSecondary1).to.equal(constants.secondary2Endpoint)
    expect(healthyNodes).to.include(newSecondary2)
    expect(issueReconfig).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key)).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key)).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)).to.be.true
  })

  it('if primary+secondary are unhealthy, return a secondary promoted to a primary, and 2 new secondaries', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint, constants.secondary1Endpoint]),
      healthyNodes,
      replicaSetNodesToUserClockStatusesMap
    })

    // Check to make sure that the new replica set is what we expect it to be
    expect(newPrimary).to.equal(constants.secondary2Endpoint)
    expect(healthyNodes).to.include(newSecondary1)
    expect(healthyNodes).to.include(newSecondary2)
    expect(issueReconfig).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key)).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key)).to.be.true
    expect(snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)).to.be.true
  })
})

describe('test SnapbackSM -- issueUpdateReplicaSetOp', function () {
  const constants = {
    primaryEndpoint: 'http://test_cn_primary.co',
    secondary1Endpoint: 'http://test_cn_secondary1.co',
    secondary2Endpoint: 'http://test_cn_secondary2.co',
    healthyNode1Endpoint: 'http://healthy1_cn.co',
    healthyNode2Endpoint: 'http://healthy2_cn.co',
    healthyNode3Endpoint: 'http://healthy3_cn.co',
    wallet: '0x4749a62b82983fdcf19ce328ef2a7f7ec8915fe5',
    userId: 1
  }

  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it('when `this.endpointToSPIdMap` is used and it does not have an spId for an endpoint, do not issue reconfig', async function () {
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './peerSetManager': sinon.stub().callsFake(() => {
          return {
            // Clear the map to mock the inability to map an endpoint to its SP id
            endpointToSPIdMap: {}
          }
        })
      }
    )
    const snapback = new mockSnapback(nodeConfig, getLibsMock())
    snapback.getLatestUserId = async () => { return 0 }
    snapback.inittedJobProcessors = true
    await snapback.init()
    
    const newReplicaSet = {
      newPrimary: constants.primaryEndpoint,
      newSecondary1: constants.secondary1Endpoint,
      newSecondary2: constants.healthyNode1Endpoint,
      issueReconfig: true
    }

    const { errorMsg, issuedReconfig } = await snapback.issueUpdateReplicaSetOp(
      constants.userId,
      constants.wallet,
      constants.primaryEndpoint,
      constants.secondary1Endpoint,
      constants.secondary2Endpoint,
      newReplicaSet
    )

    // Check to make sure that issueReconfig is false and the error is the expected error
    expect(errorMsg).to.include('unable to find valid SPs from new replica set')
    expect(issuedReconfig).to.be.false
  })

  it('if the reconfig type is not in the enabled modes, do not issue reconfig', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.ONE_SECONDARY.key)
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    const newReplicaSet = {
      newPrimary: constants.secondary1Endpoint,
      newSecondary1: constants.secondary2Endpoint,
      newSecondary2: constants.healthyNode1Endpoint,
      issueReconfig: false,
      reconfigType: "PRIMARY_AND_OR_SECONDARIES"
    }

    const { errorMsg, issuedReconfig } = await snapback.issueUpdateReplicaSetOp(
      constants.userId,
      constants.wallet,
      constants.primaryEndpoint,
      constants.secondary1Endpoint,
      constants.secondary2Endpoint,
      newReplicaSet
    )

    // Check to make sure that issueReconfig is false and the error is the expected error
    // Should log "SnapbackSM: [issueUpdateReplicaSetOp] userId=1 wallet=0x4749a62b82983fdcf19ce328ef2a7f7ec8915fe5 phase=DETERMINE_NEW_REPLICA_SET issuing reconfig disabled=false. Skipping reconfig."
    expect(errorMsg).to.be.null
    expect(issuedReconfig).to.be.false
  })
})

describe('test SnapbackSM -- aggregateReconfigAndPotentialSyncOps', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it('if the self node is the secondary and a primary spId is different from what is on chain, issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.getLatestUserId = async () => { return 0 }
    snapback.inittedJobProcessors = true
    await snapback.init()

    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    snapback.peerSetManager.endpointToSPIdMap = {
      'http://cnOriginallySpId3ReregisteredAsSpId4.co': 4,
      'http://cnWithSpId2.co': 2,
      'http://cnWithSpId3.co': 3
    }

    snapback.endpoint = 'http://cnWithSpId2.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://cnWithSpId3.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set()

    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnWithSpId3.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    assert.ok(requiredUpdateReplicaSetOps[0].unhealthyReplicas.has('http://cnOriginallySpId3ReregisteredAsSpId4.co'))
    assert.strictEqual(potentialSyncRequests.length, 0)
  })

  it('if the self node is the primary and a secondary spId is different from what is on chain, issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()

    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    snapback.peerSetManager.endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://cnOriginallySpId3ReregisteredAsSpId4.co': 4
    }

    snapback.endpoint = 'http://some_healthy_primary.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://some_healthy_primary.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set()

    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnOriginallySpId3ReregisteredAsSpId4.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    assert.ok(requiredUpdateReplicaSetOps[0].unhealthyReplicas.has('http://cnOriginallySpId3ReregisteredAsSpId4.co'))
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
  })

  it('if the self node (primary) is the same as the SP with a different spId, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()

    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    snapback.peerSetManager.endpointToSPIdMap = {
      'http://some_healthy_primary.co': 4,
      'http://cnWithSpId2.co': 2,
      'http://cnWithSpId3.co': 3
    }

    snapback.endpoint = 'http://some_healthy_primary.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://some_healthy_primary.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://cnWithSpId3.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set()

    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnWithSpId3.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    assert.strictEqual(requiredUpdateReplicaSetOps.length, 0)
    assert.strictEqual(potentialSyncRequests.length, 2)
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
    assert.strictEqual(potentialSyncRequests[1].endpoint, 'http://cnWithSpId3.co')
  })

  it('if the self node (secondary) is the same as the SP with a different spId, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()

    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    snapback.peerSetManager.endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://cnOriginallySpId3ReregisteredAsSpId4.co': 4
    }

    snapback.endpoint = 'http://cnOriginallySpId3ReregisteredAsSpId4.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://some_healthy_primary.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set()

    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnOriginallySpId3ReregisteredAsSpId4.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    assert.strictEqual(requiredUpdateReplicaSetOps.length, 0)
    assert.strictEqual(potentialSyncRequests.length, 0)
  })

  it('if any replica set node is not in the map, issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()

    // Mock the deregistered node to not have any spId
    snapback.peerSetManager.endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2
    }

    snapback.endpoint = 'http://some_healthy_primary.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://some_healthy_primary.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://deregisteredCN.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set()

    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://deregisteredCN.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    assert.ok(requiredUpdateReplicaSetOps[0].unhealthyReplicas.has('http://deregisteredCN.co'))
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
  })

  it('if the self node (primary) and 1 secondary are healthy but not the other secondary, issue reconfig for the unhealthy secondary', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()

    snapback.peerSetManager.endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://unhealthyCnWithSpId3.co': 3
    }

    snapback.endpoint = 'http://some_healthy_primary.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://some_healthy_primary.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://unhealthyCnWithSpId3.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set(['http://unhealthyCnWithSpId3.co'])

    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://unhealthyCnWithSpId3.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    // Make sure that the unhealthy secondary put into `requiredUpdateReplicaSetOps`
    assert.strictEqual(requiredUpdateReplicaSetOps.length, 1)
    assert.strictEqual(requiredUpdateReplicaSetOps[0].unhealthyReplicas.size, 1)
    assert.ok(requiredUpdateReplicaSetOps[0].unhealthyReplicas.has('http://unhealthyCnWithSpId3.co'))
    assert.strictEqual(potentialSyncRequests.length, 1)
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
  })

  it('if the self node (primary) and and secondaries are healthy but sync success rate is low, issue reconfig', async function () {
    nodeConfig.set('minimumFailedSyncRequestsBeforeReconfig', 5)
    nodeConfig.set('minimumSecondaryUserSyncSuccessPercent', 25)
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()

    snapback.peerSetManager.endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://cnWithSpId3.co': 3
    }

    snapback.endpoint = 'http://some_healthy_primary.co'

    const nodeUsers = [{
      'user_id': 1,
      'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
      'primary': 'http://some_healthy_primary.co',
      'secondary1': 'http://cnWithSpId2.co',
      'secondary2': 'http://cnWithSpId3.co',
      'primarySpID': 1,
      'secondary1SpID': 2,
      'secondary2SpID': 3
    }]

    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 1,
          failureCount: 0
        },
        'http://cnWithSpId3.co': {
          successRate: 0.1,
          successCount: 1,
          failureCount: 9
        }
      }
    }
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers, userSecondarySyncMetricsMap)

    // Make sure that the CN with low sync success put into `requiredUpdateReplicaSetOps`
    assert.strictEqual(requiredUpdateReplicaSetOps.length, 1)
    assert.strictEqual(requiredUpdateReplicaSetOps[0].unhealthyReplicas.size, 1)
    assert.ok(requiredUpdateReplicaSetOps[0].unhealthyReplicas.has('http://cnWithSpId3.co'))
    assert.strictEqual(potentialSyncRequests.length, 1)
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
  })
})

describe('test SnapbackSM -- selectRandomReplicaSetNodes', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it('replace 1 unhealthy replica', async function () {
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './StateMachineConstants': {
          MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS: 10_000
        }
      }
    )
    const snapback = new mockSnapback(nodeConfig, getLibsMock())

    const healthyReplicaSet = new Set([
      'http://healthyCn1.co',
      'http://healthyCn2.co'
    ])
    const numberOfUnhealthyReplicas = 1
    const healthyNodes = [
      'http://healthyCn1.co',
      'http://healthyCn2.co',
      'http://healthyCn4.co',
    ]
    const wallet = '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d'

    // Mock the user having no state on any of the healthy nodes
    snapback._retrieveClockValueForUserFromReplica = async (_, __) => -1

    const newReplicaSetNodes = await snapback.selectRandomReplicaSetNodes(
      healthyReplicaSet,
      numberOfUnhealthyReplicas,
      healthyNodes,
      wallet
    )

    // The missing node in healthyReplicaSet should've been replaced with a node from healthyNodes
    assert.strictEqual(newReplicaSetNodes.length, 1)
    assert.ok(healthyNodes.includes(newReplicaSetNodes[0]))
    assert.ok(!healthyReplicaSet.has(newReplicaSetNodes[0]))
  })

  it('replace 2 unhealthy replicas and ignore healthy node with state', async function () {
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './StateMachineConstants': {
          MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS: 10_000
        }
      }
    )
    const snapback = new mockSnapback(nodeConfig, getLibsMock())

    const healthyReplicaSet = new Set([
      'http://healthyCn1.co'
    ])
    const numberOfUnhealthyReplicas = 2
    const healthyNodes = [
      'http://healthyCn1.co',
      'http://healthyNodeWithUserState.co',
      'http://healthyCn4.co',
      'http://healthyCn5.co',
    ]
    const wallet = '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d'

    // Mock the user having state on only one node (that node should be ignored during selection)
    snapback._retrieveClockValueForUserFromReplica = async (node, _) => {
      return node === 'http://healthyNodeWithUserState.co' ? 1 : -1
    }

    const newReplicaSetNodes = await snapback.selectRandomReplicaSetNodes(
      healthyReplicaSet,
      numberOfUnhealthyReplicas,
      healthyNodes,
      wallet
    )

    // The missing nodes in healthyReplicaSet should've been replaced with 2 node from healthyNodes but not the node with user state
    assert.strictEqual(newReplicaSetNodes.length, 2)
    assert.ok(newReplicaSetNodes.every((newReplicaSetNode) => healthyNodes.includes(newReplicaSetNode)))
    assert.ok(newReplicaSetNodes.every((newReplicaSetNode) => !healthyReplicaSet.has(newReplicaSetNode)))
    assert.ok(newReplicaSetNodes.every((newReplicaSetNode) => newReplicaSetNode !== 'http://healthyNodeWithUserState.co'))
  })

  it('throw if insufficient number of new replica sets exist', async function () {
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './StateMachineConstants': {
          MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS: 100
        }
      }
    )
    const snapback = new mockSnapback(nodeConfig, getLibsMock())

    const healthyReplicaSet = new Set([
      'http://healthyCn1.co'
    ])
    const numberOfUnhealthyReplicas = 2
    const healthyNodes = [
      'http://healthyCn1.co',
      'http://healthyNodeWithUserState.co',
      'http://healthyCn4.co',
    ]
    const wallet = '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d'

    // Mock the user having state on only one node (that node should be ignored during selection)
    snapback._retrieveClockValueForUserFromReplica = async (node, _) => {
      return node === 'http://healthyNodeWithUserState.co' ? 1 : -1
    }

    // Only 1 node is healthy and doesn't have user state, so it should throw when it can't find a second node
    await assert.rejects(async () => {
      await snapback.selectRandomReplicaSetNodes(
        healthyReplicaSet,
        numberOfUnhealthyReplicas,
        healthyNodes,
        wallet
      )
    }, /.*Not enough healthy nodes found to issue new replica set.*100 attempts.*/
    ).catch((reason) => {
      assert.ok(false, reason)
    })
  })
})

describe('test SnapbackSM -- retrieveClockStatusesForUsersAcrossReplicaSet', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it('returns expected clock values and updates unhealthyPeers', async function () {
    nodeConfig.set('maxBatchClockStatusBatchSize', 2)

    const expectedReplicaToClockValueMap = {
      'http://healthyCn1.co': {
        'wallet1': 1,
        'wallet2': 2,
        'wallet3': 3,
        'wallet4': 4,
        'wallet5': 5
      },
      'http://healthyCn2.co': {
        'wallet1': 10,
        'wallet2': 20
      },
      'http://unhealthyCn.co': {}
    }

    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        'axios': async (params) => {
          const { baseURL: replica, data } = params
          if (replica === 'http://unhealthyCn.co') {
            return { data: {} }
          }
          const { walletPublicKeys } = data
          const users = walletPublicKeys.map((walletPublicKey) => {
            return {
              walletPublicKey,
              clock: expectedReplicaToClockValueMap[replica][walletPublicKey]
            }
          })
          return { data: { data: { users } } }
        },
        './StateMachineConstants': {
          MAX_USER_BATCH_CLOCK_FETCH_RETRIES: 1
        }
      }
    )
    const snapback = new mockSnapback(nodeConfig, getLibsMock())

    const replicasToWalletsMap = {
      'http://healthyCn1.co': ['wallet1', 'wallet2', 'wallet3', 'wallet4', 'wallet5'],
      'http://healthyCn2.co': ['wallet1', 'wallet2'],
      'http://unhealthyCn.co': ['wallet1', 'wallet2']
    }
    const {
      replicasToUserClockStatusMap,
      unhealthyPeers
    } = await snapback.retrieveClockStatusesForUsersAcrossReplicaSet(replicasToWalletsMap)

    // Each wallet should have the expected clock value, and the unhealthy node should've caused an error
    expect(Object.keys(replicasToUserClockStatusMap)).to.have.lengthOf(3)
    expect(replicasToUserClockStatusMap).to.deep.equal(expectedReplicaToClockValueMap)
    expect(unhealthyPeers).to.have.property('size', 1)
    expect(unhealthyPeers).to.include('http://unhealthyCn.co')
  })
})

describe('test SnapbackSM -- issueSyncRequestsToSecondaries', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it("doesn't sync when endpoint clock value is >= than primary", async function () {
    const userReplicaSets = [
      {
        'user_id': 1,
        'wallet': 'wallet1',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 2,
        'wallet': 'wallet2',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 3,
        'wallet': 'wallet3',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      }
    ]
    const replicaSetNodesToUserClockStatusesMap = {
      'http://healthyCn1.co': {
        'wallet1': 10,
        'wallet2': 10,
        'wallet3': 10
      },
      'http://outOfSyncCn.co': {
        'wallet1': 10,
        'wallet2': 11,
        'wallet3': 20
      }
    }

    // Set our node (snapback.endpoint) to the users' primary
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.endpoint = 'http://healthyCn1.co'

    // Stub enqueuing the sync to be successful
    const enqueueSyncStub = sinon.stub().resolves()
    snapback.enqueueSync = enqueueSyncStub

    const {
      numSyncRequestsRequired,
      numSyncRequestsEnqueued,
      enqueueSyncRequestErrors
    } = await snapback.issueSyncRequestsToSecondaries(userReplicaSets, replicaSetNodesToUserClockStatusesMap)

    assert.strictEqual(numSyncRequestsRequired, 0)
    assert.strictEqual(numSyncRequestsEnqueued, 0)
    assert.strictEqual(enqueueSyncRequestErrors.length, 0)
  })

  it('syncs when endpoint clock value is lower than primary', async function () {
    const userReplicaSets = [
      {
        'user_id': 1,
        'wallet': 'wallet1',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 2,
        'wallet': 'wallet2',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 3,
        'wallet': 'wallet3',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      }
    ]
    const replicaSetNodesToUserClockStatusesMap = {
      'http://healthyCn1.co': {
        'wallet1': 10,
        'wallet2': 10,
        'wallet3': 10
      },
      'http://outOfSyncCn.co': {
        'wallet1': 10,
        'wallet2': 9,
        'wallet3': -1
      }
    }

    // Set our node (snapback.endpoint) to the users' primary
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.endpoint = 'http://healthyCn1.co'

    // Stub enqueuing the sync to be successful
    const enqueueSyncStub = sinon.stub().resolves()
    snapback.enqueueSync = enqueueSyncStub

    const {
      numSyncRequestsRequired,
      numSyncRequestsEnqueued,
      enqueueSyncRequestErrors
    } = await snapback.issueSyncRequestsToSecondaries(userReplicaSets, replicaSetNodesToUserClockStatusesMap)

    assert.strictEqual(numSyncRequestsRequired, 2)
    assert.strictEqual(numSyncRequestsEnqueued, 2)
    assert.strictEqual(enqueueSyncRequestErrors.length, 0)
    sinon.assert.calledTwice(enqueueSyncStub)
    const syncEnqueues = [...enqueueSyncStub.getCall(0).args, ...enqueueSyncStub.getCall(1).args]
    assert.deepStrictEqual(
      syncEnqueues,
      [
        {
          userWallet: 'wallet2',
          secondaryEndpoint: 'http://outOfSyncCn.co',
          primaryEndpoint: snapback.endpoint,
          syncType: SyncType.Recurring
        },
        {
          userWallet: 'wallet3',
          secondaryEndpoint: 'http://outOfSyncCn.co',
          primaryEndpoint: snapback.endpoint,
          syncType: SyncType.Recurring
        }
      ]
    )
  })

  it("short circuit when our node (snapback.endpoint) is not the user's primary", async function () {
    const userReplicaSets = [
      {
        'user_id': 1,
        'wallet': 'wallet1',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 2,
        'wallet': 'wallet2',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 3,
        'wallet': 'wallet3',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      }
    ]
    const replicaSetNodesToUserClockStatusesMap = {
      'http://healthyCn1.co': {
        'wallet1': 10,
        'wallet2': 10,
        'wallet3': 10
      },
      'http://outOfSyncCn.co': {
        'wallet1': 10,
        'wallet2': 9,
        'wallet3': -1
      }
    }

    // Set our node (snapback.endpoint) to something that is NOT the users' primary
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.endpoint = 'http://randomCnode.co'

    // Stub enqueuing the sync to be successful
    const enqueueSyncStub = sinon.stub().resolves()
    snapback.enqueueSync = enqueueSyncStub

    const {
      numSyncRequestsRequired,
      numSyncRequestsEnqueued,
      enqueueSyncRequestErrors
    } = await snapback.issueSyncRequestsToSecondaries(userReplicaSets, replicaSetNodesToUserClockStatusesMap)

    assert.strictEqual(numSyncRequestsRequired, 0)
    assert.strictEqual(numSyncRequestsEnqueued, 0)
    assert.strictEqual(enqueueSyncRequestErrors.length, 0)
    sinon.assert.notCalled(enqueueSyncStub)
  })

  it('catch and log when enqueueSync throws error', async function () {
    const userReplicaSets = [
      {
        'user_id': 1,
        'wallet': 'wallet1',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 2,
        'wallet': 'wallet2',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      },
      {
        'user_id': 3,
        'wallet': 'wallet3',
        'primary': 'http://healthyCn1.co',
        'secondary1': 'http://healthyCn2.co',
        'secondary2': 'http://healthyCn3.co',
        'endpoint': 'http://outOfSyncCn.co'
      }
    ]
    const replicaSetNodesToUserClockStatusesMap = {
      'http://healthyCn1.co': {
        'wallet1': 10,
        'wallet2': 10,
        'wallet3': 10
      },
      'http://outOfSyncCn.co': {
        'wallet1': 10,
        'wallet2': 9,
        'wallet3': -1
      }
    }

    // Set our node (snapback.endpoint) to the users' primary
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.endpoint = 'http://healthyCn1.co'

    // Stub enqueuing the sync to throw an error
    const enqueueSyncStub = sinon.stub().rejects()
    snapback.enqueueSync = enqueueSyncStub

    const {
      numSyncRequestsRequired,
      numSyncRequestsEnqueued,
      enqueueSyncRequestErrors
    } = await snapback.issueSyncRequestsToSecondaries(userReplicaSets, replicaSetNodesToUserClockStatusesMap)

    assert.strictEqual(numSyncRequestsRequired, 2)
    assert.strictEqual(numSyncRequestsEnqueued, 0)
    assert.strictEqual(enqueueSyncRequestErrors.length, 2)
    sinon.assert.calledTwice(enqueueSyncStub)
  })
})

describe('test SnapbackSM -- processStateMachineOperation', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it('runs all steps without throwing', async function () {
    // Make dummy data
    const nodeUsers = [{ 'testUser': 'testUser' }]
    const unhealthyPeers = ['testUnhealthyPeer']
    const replicaSetNodesToUserWalletsMap = { 'http://healthCn1.co': ['wallet1'] }
    const replicaSetNodesToUserClockStatusesMap = { 'http://healthCn1.co': { 'wallet1': 1 } }
    const userSecondarySyncSuccessRatesMap = { 'dummyMap': 'dummyMap' }
    
    // Make stubs
    const getNodeUsersStub = sinon.stub().returns(nodeUsers)
    const getUnhealthyPeersStub = sinon.stub().returns(unhealthyPeers)
    const buildReplicaSetNodesToUserWalletsMapStub = sinon.stub().returns(replicaSetNodesToUserWalletsMap)
    const updateEndpointToSpIdMapStub = sinon.stub().resolves()
    const retrieveClockStatusesForUsersAcrossReplicaSetStub = sinon.stub().resolves(
      {
        replicasToUserClockStatusMap: replicaSetNodesToUserClockStatusesMap,
        unhealthyPeers: new Set()
      }
    )
    const computeUserSecondarySyncSuccessRatesMapStub = sinon.stub().resolves(userSecondarySyncSuccessRatesMap)

    // Wire up the stubs
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './peerSetManager': sinon.stub().callsFake(() => {
          return {
            getNodeUsers: getNodeUsersStub,
            getUnhealthyPeers: getUnhealthyPeersStub,
            buildReplicaSetNodesToUserWalletsMap: buildReplicaSetNodesToUserWalletsMapStub,
            updateEndpointToSpIdMap: updateEndpointToSpIdMapStub,
            endpointToSPIdMap: {}
          }
        })
      }
    )
    const snapback = new mockSnapback(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()
    snapback.endpoint = 'http://healthyCn1.co'
    snapback.retrieveClockStatusesForUsersAcrossReplicaSet = retrieveClockStatusesForUsersAcrossReplicaSetStub
    snapback.computeUserSecondarySyncSuccessRatesMap = computeUserSecondarySyncSuccessRatesMapStub

    const jobId = 1
    await snapback.processStateMachineOperation(jobId)

    expect(getNodeUsersStub).to.have.been.calledOnce
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(nodeUsers)
    expect(buildReplicaSetNodesToUserWalletsMapStub).to.have.been.calledOnceWithExactly(nodeUsers)
    expect(updateEndpointToSpIdMapStub).to.have.been.calledOnce
    expect(retrieveClockStatusesForUsersAcrossReplicaSetStub).to.have.been.calledOnceWithExactly(replicaSetNodesToUserWalletsMap)
    expect(computeUserSecondarySyncSuccessRatesMapStub).to.have.been.calledOnceWithExactly(nodeUsers)
  })
})

describe('test SnapbackSM -- additionalSyncIsRequired', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it('additional sync is required when secondary updates clock value but clock value is still behind primary', async function () {
    const userWallet = 'wallet1'
    const primaryClockValue = 5
    const initialSecondaryClockValue = 2
    const finalSecondaryClockValue = 3
    const secondaryUrl = 'http://healthyCn1.co'
    const syncType = SyncType.Recurring

    nodeConfig.set('maxSyncMonitoringDurationInMs', 100)
    const recordSuccessStub = sinon.stub().resolves()
    const recordFailureStub = sinon.stub().resolves()
    const retrieveClockValueForUserFromReplicaStub = sinon.stub()
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './secondarySyncHealthTracker': {
          recordSuccess: recordSuccessStub,
          recordFailure: recordFailureStub
        },
        './StateMachineConstants': {
          SYNC_MONITORING_RETRY_DELAY_MS: 1
          }
      }
    )

    const snapback = new mockSnapback(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()
    snapback._retrieveClockValueForUserFromReplica = retrieveClockValueForUserFromReplicaStub
    retrieveClockValueForUserFromReplicaStub.resolves(finalSecondaryClockValue)
    retrieveClockValueForUserFromReplicaStub.onCall(0).resolves(initialSecondaryClockValue)

    const additionalSyncIsRequired = await snapback.additionalSyncIsRequired(
      userWallet,
      primaryClockValue,
      secondaryUrl,
      syncType
    )

    expect(retrieveClockValueForUserFromReplicaStub.callCount).to.be.greaterThanOrEqual(2)
    expect(additionalSyncIsRequired).to.be.true
    expect(recordSuccessStub).to.have.been.calledOnceWithExactly(
      secondaryUrl,
      userWallet,
      syncType
    )
    expect(recordFailureStub).to.have.not.been.called
  })

  it("additional sync is required when secondary doesn't update clock during sync", async function () {
    const userWallet = 'wallet1'
    const primaryClockValue = 5
    const finalSecondaryClockValue = 2
    const secondaryUrl = 'http://healthyCn1.co'
    const syncType = SyncType.Recurring

    nodeConfig.set('maxSyncMonitoringDurationInMs', 100)
    const recordSuccessStub = sinon.stub().resolves()
    const recordFailureStub = sinon.stub().resolves()
    const retrieveClockValueForUserFromReplicaStub = sinon.stub()
    const { SnapbackSM: mockSnapback } = proxyquire(
      '../src/snapbackSM/snapbackSM.js',
      {
        './secondarySyncHealthTracker': {
          recordSuccess: recordSuccessStub,
          recordFailure: recordFailureStub
        },
        './StateMachineConstants': {
          SYNC_MONITORING_RETRY_DELAY_MS: 1
          }
      }
    )

    const snapback = new mockSnapback(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()
    snapback._retrieveClockValueForUserFromReplica = retrieveClockValueForUserFromReplicaStub
    retrieveClockValueForUserFromReplicaStub.resolves(finalSecondaryClockValue)

    const additionalSyncIsRequired = await snapback.additionalSyncIsRequired(
      userWallet,
      primaryClockValue,
      secondaryUrl,
      syncType
    )

    expect(retrieveClockValueForUserFromReplicaStub.callCount).to.be.greaterThanOrEqual(2)
    expect(additionalSyncIsRequired).to.be.true
    expect(recordFailureStub).to.have.been.calledOnceWithExactly(
      secondaryUrl,
      userWallet,
      syncType
    )
    expect(recordSuccessStub).to.have.not.been.called
  })
})

describe('test SnapbackSM -- computeUserSecondarySyncSuccessRatesMap', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app

    await app.get('redisClient').flushdb()

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  it("[computeUserSecondarySyncSuccessRatesMap] ", async function () {
    const nodeUsers = [
      {
        'user_id': 1,
        'wallet': '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        'primary': 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        'secondary1': 'http://cnWithSpId2.co',
        'secondary2': 'http://cnWithSpId3.co',
        'primarySpID': 1,
        'secondary1SpID': 2,
        'secondary2SpID': 3
      },
      {
        'user_id': 2,
        'wallet': 'wallet2',
        'primary': 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        'secondary1': 'http://cnWithSpId2.co',
        'secondary2': 'http://cnWithSpId3.co',
        'primarySpID': 1,
        'secondary1SpID': 2,
        'secondary2SpID': 3
      }
    ]

    await SecondarySyncHealthTracker.recordSuccess(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordSuccess(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordSuccess(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordFailure(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordFailure(
      [nodeUsers[0].secondary2],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )

    const expectedUserSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        [nodeUsers[0].secondary1]: {
          successRate: 0.75,
          successCount: 3,
          failureCount: 1
        },
        [nodeUsers[0].secondary2]: {
          successRate: 0,
          successCount: 0,
          failureCount: 1
        }
      },
      [nodeUsers[1].wallet]: {
        [nodeUsers[1].secondary1]: {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        [nodeUsers[1].secondary2]: {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }

    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    snapback.inittedJobProcessors = true
    snapback.getLatestUserId = async () => { return 0 }
    await snapback.init()
    const userSecondarySyncMetricsMap = await snapback.computeUserSecondarySyncSuccessRatesMap(nodeUsers)

    expect(userSecondarySyncMetricsMap).to.deep.equal(expectedUserSecondarySyncMetricsMap)
  })
})
