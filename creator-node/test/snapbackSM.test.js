const nock = require('nock')
const assert = require('assert')

const { SnapbackSM, SyncType, RECONFIG_MODES } = require('../src/snapbackSM/snapbackSM')
const models = require('../src/models')
const { getLibsMock } = require('./lib/libsMock')
const utils = require('../src/utils')
const { getApp } = require('./lib/app')
const nodeConfig = require('../src/config')

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

describe('test SnapbackSM', function () {
  let server

  beforeEach(async function () {
    // init app to run migrations
    const appInfo = await getApp()
    server = appInfo.server

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
    nock.cleanAll()
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

  it('[determineNewReplicaSet] if config has an unrecognizable mode, default to `RECONFIG_DISABLED`', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', 'pizza')

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    assert.strictEqual(snapback.highestEnabledReconfigMode, RECONFIG_MODES.RECONFIG_DISABLED.key)
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.RECONFIG_DISABLED.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))
  })

  it('[determineNewReplicaSet] if the mode enabled does not cover the reconfig type, do not issue reconfig', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.RECONFIG_DISABLED.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    nock(constants.primaryEndpoint)
      .persist()
      .get(() => true)
      .reply(500)

    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.secondary2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.healthyNode1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode3Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

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
    assert.strictEqual(newPrimary, constants.secondary2Endpoint)
    assert.ok(healthyNodes.includes(newSecondary1))
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, false)
    assert.ok(!snapback.isReconfigEnabled(RECONFIG_MODES.RECONFIG_DISABLED.key))
  })

  it('[determineNewReplicaSet] if entire replica set is unhealthy, return falsy replica set', async function () {
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
    assert.strictEqual(newPrimary, null)
    assert.strictEqual(newSecondary1, null)
    assert.strictEqual(newSecondary2, null)
    assert.strictEqual(issueReconfig, false)
  })

  it('[determineNewReplicaSet] if one secondary is unhealthy, return new secondary', async function () {
    // Set `snapbackHighestReconfigMode` to 'ONE_SECONDARY'
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.ONE_SECONDARY.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.secondary2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.healthyNode1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode3Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

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
    assert.strictEqual(newPrimary, constants.primaryEndpoint)
    assert.strictEqual(newSecondary1, constants.secondary1Endpoint)
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
  })

  it('[determineNewReplicaSet] if both secondaries are unhealthy, return two new secondaries ', async function () {
    // Set `snapbackHighestReconfigMode` to 'MULTIPLE_SECONDARIES'
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.MULTIPLE_SECONDARIES.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.secondary2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.healthyNode1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode3Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

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
    assert.strictEqual(newPrimary, constants.primaryEndpoint)
    assert.ok(healthyNodes.includes(newSecondary1))
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
  })

  it('[determineNewReplicaSet] if one primary is unhealthy, return a secondary promoted to primary, existing secondary1, and new secondary2', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    nock(constants.primaryEndpoint)
      .persist()
      .get(() => true)
      .reply(500)

    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.secondary2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.healthyNode1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode3Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

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
    assert.strictEqual(newPrimary, constants.secondary1Endpoint)
    assert.strictEqual(newSecondary1, constants.secondary2Endpoint)
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))
  })

  it('[determineNewReplicaSet] if primary+secondary are unhealthy, return a secondary promoted to a primary, and 2 new secondaries', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key)

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    nock(constants.primaryEndpoint)
      .persist()
      .get(() => true)
      .reply(500)

    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.secondary2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.healthyNode1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode3Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

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
    assert.strictEqual(newPrimary, constants.secondary2Endpoint)
    assert.ok(healthyNodes.includes(newSecondary1))
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.ONE_SECONDARY.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.MULTIPLE_SECONDARIES.key))
    assert.ok(snapback.isReconfigEnabled(RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key))
  })

  it('[issueUpdateReplicaSetOp] if when `this.endpointToSPIdMap` is used and it does not have an spId for an endpoint, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Clear the map to mock the inability to map an endpoint to its SP id
    snapback.endpointToSPIdMap = {}
    // Return default response
    snapback.determineNewReplicaSet = async () => {
      return {
        newPrimary: constants.primaryEndpoint,
        newSecondary1: constants.secondary1Endpoint,
        newSecondary2: constants.healthyNode1Endpoint,
        issueReconfig: true
      }
    }

    const { errorMsg, issuedReconfig } = await snapback.issueUpdateReplicaSetOp(
      constants.userId,
      constants.wallet,
      constants.primaryEndpoint,
      constants.secondary1Endpoint,
      constants.secondary2Endpoint,
      [constants.secondary1Endpoint] /* unhealthyReplicas */,
      healthyNodes /* healthyNodes */,
      replicaSetNodesToUserClockStatusesMap
    )

    // Check to make sure that issueReconfig is false and the error is the expected error
    assert.ok(errorMsg.includes('unable to find valid SPs from new replica set'))
    assert.strictEqual(issuedReconfig, false)
  })

  it('[issueUpdateReplicaSetOp] if the reconfig type is not in the enabled modes, do not issue reconfig', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', RECONFIG_MODES.ONE_SECONDARY.key)
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    // Mark primary as unhealthy
    nock(constants.primaryEndpoint)
      .persist()
      .get(() => true)
      .reply(500)

    nock(constants.secondary1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.secondary2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: { clockValue: 10 } })

    nock(constants.healthyNode1Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode2Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    nock(constants.healthyNode3Endpoint)
      .persist()
      .get(() => true)
      .reply(200, { data: healthCheckVerboseResponse })

    // Mock as unhealthy
    const replicaSetNodesToUserClockStatusesMapCopy = { ...replicaSetNodesToUserClockStatusesMap }
    replicaSetNodesToUserClockStatusesMapCopy[constants.primaryEndpoint][constants.wallet] = undefined

    const { errorMsg, issuedReconfig } = await snapback.issueUpdateReplicaSetOp(
      constants.userId,
      constants.wallet,
      constants.primaryEndpoint,
      constants.secondary1Endpoint,
      constants.secondary2Endpoint,
      [constants.primaryEndpoint] /* unhealthyReplicas */,
      healthyNodes /* healthyNodes */,
      replicaSetNodesToUserClockStatusesMapCopy
    )

    // Check to make sure that issueReconfig is false and the error is the expected error
    // Should log "SnapbackSM: [issueUpdateReplicaSetOp] userId=1 wallet=0x4749a62b82983fdcf19ce328ef2a7f7ec8915fe5 phase=DETERMINE_NEW_REPLICA_SET issuing reconfig disabled=false. Skipping reconfig."
    assert.strictEqual(errorMsg, null)
    assert.strictEqual(issuedReconfig, false)
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

  it('[aggregateReconfigAndPotentialSyncOps] if the self node is the secondary and a primary spId is different from what is on chain, issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

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

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    assert.strictEqual(requiredUpdateReplicaSetOps[0].unhealthyReplicas[0], 'http://cnOriginallySpId3ReregisteredAsSpId4.co')
    assert.strictEqual(potentialSyncRequests.length, 0)
  })

  it('[aggregateReconfigAndPotentialSyncOps] if the self node is the primary and a secondary spId is different from what is on chain, issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock these as very nodes that completed only successful syncs
    snapback._computeUserSecondarySyncSuccessRates = async () => {
      return {
        'http://cnWithSpId2.co': {
          SuccessRate: 100
        },
        'http://cnOriginallySpId3ReregisteredAsSpId4.co': {
          SuccessRate: 100
        }
      }
    }

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

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    assert.strictEqual(requiredUpdateReplicaSetOps[0].unhealthyReplicas[0], 'http://cnOriginallySpId3ReregisteredAsSpId4.co')
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
  })

  it('[aggregateReconfigAndPotentialSyncOps] if the self node (primary) is the same as the SP with a different spId, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock these as very nodes that completed only successful syncs
    snapback._computeUserSecondarySyncSuccessRates = async () => {
      return {
        'http://cnWithSpId2.co': {
          SuccessRate: 100
        },
        'http://cnWithSpId3.co': {
          SuccessRate: 100
        }
      }
    }

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

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    assert.strictEqual(requiredUpdateReplicaSetOps.length, 0)
    assert.strictEqual(potentialSyncRequests.length, 2)
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
    assert.strictEqual(potentialSyncRequests[1].endpoint, 'http://cnWithSpId3.co')
  })

  it('[aggregateReconfigAndPotentialSyncOps] if the self node (secondary) is the same as the SP with a different spId, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

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

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    assert.strictEqual(requiredUpdateReplicaSetOps.length, 0)
    assert.strictEqual(potentialSyncRequests.length, 0)
  })

  it('[aggregateReconfigAndPotentialSyncOps] if any replica set node is not in the map, issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock these as very nodes that completed only successful syncs
    snapback._computeUserSecondarySyncSuccessRates = async () => {
      return {
        'http://cnWithSpId2.co': {
          SuccessRate: 100
        },
        'http://deregisteredCN.co': {
          SuccessRate: 100
        }
      }
    }

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

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    assert.strictEqual(requiredUpdateReplicaSetOps[0].unhealthyReplicas[0], 'http://deregisteredCN.co')
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
  })

  // TODO: The below tests will become redundant when Discovery upgrades. Remove then.

  it('[aggregateReconfigAndPotentialSyncOps] if Discovery Node does not respond with replica set spIds, the spId is mismatched, and the self node is the primary, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock these as very nodes that completed only successful syncs
    snapback._computeUserSecondarySyncSuccessRates = async () => {
      return {
        'http://cnWithSpId2.co': {
          SuccessRate: 100
        },
        'http://cnOriginallySpId3ReregisteredAsSpId4.co': {
          SuccessRate: 100
        }
      }
    }

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
      'secondary2': 'http://cnOriginallySpId3ReregisteredAsSpId4.co'
    }]

    const unhealthyPeers = new Set()

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    assert.strictEqual(requiredUpdateReplicaSetOps.length, 0)
    assert.strictEqual(potentialSyncRequests.length, 2)
    assert.strictEqual(potentialSyncRequests[0].endpoint, 'http://cnWithSpId2.co')
    assert.strictEqual(potentialSyncRequests[1].endpoint, 'http://cnOriginallySpId3ReregisteredAsSpId4.co')
  })

  it('[aggregateReconfigAndPotentialSyncOps] if Discovery Node does not respond with replica set spIds, the spId is mismatched, and the self node is a secondary, do not issue reconfig', async function () {
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

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
      'secondary2': 'http://cnOriginallySpId3ReregisteredAsSpId4.co'
    }]

    const unhealthyPeers = new Set()

    const { requiredUpdateReplicaSetOps, potentialSyncRequests } = await snapback.aggregateReconfigAndPotentialSyncOps(nodeUsers, unhealthyPeers)

    assert.strictEqual(requiredUpdateReplicaSetOps.length, 0)
    assert.strictEqual(potentialSyncRequests.length, 0)
  })
})
