const nock = require('nock')
const assert = require('assert')

const { SnapbackSM, SyncType } = require('../src/snapbackSM/snapbackSM')
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
  wallet: '0x4749a62b82983fdcf19ce328ef2a7f7ec8915fe5'
}

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

  it('[determineNewReplicaSet] if entire replica set is unhealthy, return falsy replica set ', async function () {
    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Pass in size 3 of `unhealthyReplicasSet`
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint, constants.secondary1Endpoint, constants.secondary2Endpoint]),
      healthyNodes
    })

    // Check to make sure that the return is falsy
    assert.strictEqual(newPrimary, null)
    assert.strictEqual(newSecondary1, null)
    assert.strictEqual(newSecondary2, null)
    assert.strictEqual(issueReconfig, true) // TODO: probably make this return false
  })

  it('[determineNewReplicaSet] if one secondary is unhealthy, return new secondary ', async function () {
    // Set `snapbackHighestReconfigMode` to 'ONE_SECONDARY'
    nodeConfig.set('snapbackHighestReconfigMode', 'ONE_SECONDARY')

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
      healthyNodes
    })

    // Check to make sure that the new replica set is what we expect it to be
    // Primary is the same, secondary1 is the same, secondary2 is replaced
    assert.strictEqual(newPrimary, constants.primaryEndpoint)
    assert.strictEqual(newSecondary1, constants.secondary1Endpoint)
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.enabledReconfigModes.has('RECONFIG_DISABLED'))
    assert.ok(snapback.enabledReconfigModes.has('ONE_SECONDARY'))
  })

  it('[determineNewReplicaSet] if both secondaries are unhealthy, return two new secondaries ', async function () {
    // Set `snapbackHighestReconfigMode` to 'MULTIPLE_SECONDARIES'
    nodeConfig.set('snapbackHighestReconfigMode', 'MULTIPLE_SECONDARIES')

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
      healthyNodes
    })

    // Check to make sure that the new replica set is what we expect it to be
    // Primary is the same, secondary1 and secondary2 are replaced
    assert.strictEqual(newPrimary, constants.primaryEndpoint)
    assert.ok(healthyNodes.includes(newSecondary1))
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.enabledReconfigModes.has('RECONFIG_DISABLED'))
    assert.ok(snapback.enabledReconfigModes.has('ONE_SECONDARY'))
    assert.ok(snapback.enabledReconfigModes.has('MULTIPLE_SECONDARIES'))
  })

  it('[determineNewReplicaSet] if one primary is unhealthy and the primary has not been health checked yet, return falsy replica set', async function () {
    // Set `snapbackHighestReconfigMode` to 'MULTIPLE_SECONDARIES'
    nodeConfig.set('snapbackHighestReconfigMode', 'MULTIPLE_SECONDARIES')

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
      unhealthyReplicasSet: new Set([constants.primaryEndpoint]),
      healthyNodes
    })

    // Check to make sure that the new replica set is what we expect it to be
    // New replica set are all falsy
    assert.strictEqual(newPrimary, null)
    assert.strictEqual(newSecondary1, null)
    assert.strictEqual(newSecondary2, null)
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.enabledReconfigModes.has('RECONFIG_DISABLED'))
    assert.ok(snapback.enabledReconfigModes.has('ONE_SECONDARY'))
    assert.ok(snapback.enabledReconfigModes.has('MULTIPLE_SECONDARIES'))
  })

  it('[determineNewReplicaSet] if one primary is unhealthy on first iteration, and on second iteration fails the health check again, return a secondary promoted to primary, existing secondary1, and new secondary2', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', 'PRIMARY_AND_OR_SECONDARIES')

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

    // First iteration - Pass in size 1 of `unhealthyReplicasSet`
    await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint]),
      healthyNodes
    })

    // Second iteration - Pass in size 1 of `unhealthyReplicasSet`
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint]),
      healthyNodes
    })

    // Check to make sure that the new replica set is what we expect it to be
    assert.strictEqual(newPrimary, constants.secondary1Endpoint)
    assert.strictEqual(newSecondary1, constants.secondary2Endpoint)
    assert.ok(healthyNodes.includes(newSecondary2))
    assert.strictEqual(issueReconfig, true)
    assert.ok(snapback.enabledReconfigModes.has('RECONFIG_DISABLED'))
    assert.ok(snapback.enabledReconfigModes.has('ONE_SECONDARY'))
    assert.ok(snapback.enabledReconfigModes.has('MULTIPLE_SECONDARIES'))
    assert.ok(snapback.enabledReconfigModes.has('PRIMARY_AND_OR_SECONDARIES'))
  })

  it('[determineNewReplicaSet] if one primary is unhealthy on first iteration, and on second iteration passes the health check, keep existing replica set and return falsy replica set', async function () {
    nodeConfig.set('snapbackHighestReconfigMode', 'PRIMARY_AND_OR_SECONDARIES')

    // Create SnapbackSM instance
    const snapback = new SnapbackSM(nodeConfig, getLibsMock())

    // Mock `selectRandomReplicaSetNodes` to return the healthy nodes
    snapback.selectRandomReplicaSetNodes = async () => { return healthyNodes }

    nock(constants.primaryEndpoint)
      .get(() => true)
      .reply(500, { data: 'THIS IS SAD' })

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

    // First iteration - Primary is unhealthy
    await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint]),
      healthyNodes
    })

    nock(constants.primaryEndpoint)
      .get('/health_check/verbose')
      .reply(200, { data: healthCheckVerboseResponse })

    // Second iteration - Primary becomes healthy during check
    const { newPrimary, newSecondary1, newSecondary2, issueReconfig } = await snapback.determineNewReplicaSet({
      primary: constants.primaryEndpoint,
      secondary1: constants.secondary1Endpoint,
      secondary2: constants.secondary2Endpoint,
      wallet: constants.wallet,
      unhealthyReplicasSet: new Set([constants.primaryEndpoint]),
      healthyNodes
    })

    // Check to make sure that the new replica set is what we expect it to be
    assert.strictEqual(newPrimary, null)
    assert.strictEqual(newSecondary1, null)
    assert.strictEqual(newSecondary2, null)
    assert.strictEqual(issueReconfig, false)
    assert.ok(snapback.enabledReconfigModes.has('RECONFIG_DISABLED'))
    assert.ok(snapback.enabledReconfigModes.has('ONE_SECONDARY'))
    assert.ok(snapback.enabledReconfigModes.has('MULTIPLE_SECONDARIES'))
    assert.ok(snapback.enabledReconfigModes.has('PRIMARY_AND_OR_SECONDARIES'))
  })

  // it('[determineNewReplicaSet] if primary+secondary are unhealthy on first iteration, and the primary has not been health checked yet, return falsy replica set', async function () {

  // })

  // it('[determineNewReplicaSet] if primary+secondary are unhealthy on first iteration, and on second iteration the primary fails the health check again, return a secondary promoted to a primary, and 2 new secondaries', async function () {

  // })

  // it('[determineNewReplicaSet] if primary+secondary are unhealthy on first iteration, and on second iteration the primary passes the health check, return the existing replica set with a new secondary', async function () {

  // })

  // // think about this one
  // it('[determineNewReplicaSet] if primary is added to `this.unhealthyPrimaryMap` only once, ensure that after it gets cleared after some amount of time', async function () {

  // })
})
