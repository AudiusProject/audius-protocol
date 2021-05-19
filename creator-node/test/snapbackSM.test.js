const nock = require('nock')
const assert = require('assert')

const { SnapbackSM, SyncType } = require('../src/SnapbackStateMachine/snapbackSM')
const models = require('../src/models')
const { getLibsMock } = require('./lib/libsMock')
const utils = require('../src/utils')
const { getApp } = require('./lib/app')
const nodeConfig = require('../src/config')

const constants = {
  secondaryEndpoint: 'http://test_cn_2.co',
  primaryEndpoint: 'http://test_cn.co',
  primaryClockVal: 1
}

describe('test sync queue', function () {
  let server

  before(async function () {
    // init app to run migrations
    const appInfo = await getApp()
    server = appInfo.server

    nodeConfig.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
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
    nock(constants.secondaryEndpoint)
      .persist()
      .post(() => true)
      .reply(200)

    // Mock out the secondary monitoring response with a 500ms delay
    nock(constants.secondaryEndpoint)
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
        secondaryEndpoint: constants.secondaryEndpoint,
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
        secondaryEndpoint: constants.secondaryEndpoint,
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
})
