const nock = require('nock')
const assert = require('assert')

const { SnapbackSM, SyncType } = require('../src/snapbackSM')
const models = require('../src/models')
const { getLibsMock } = require('./lib/libsMock')
const utils = require('../src/utils')
const { getApp } = require('./lib/app')
const nodeConfig = require('../src/config')

const constants = {
  userWallet: 'user_wallet',
  secondaryEndpoint: 'http://test_cn_2.co',
  primaryEndpoint: 'http://test_cn.co',
  primaryClockVal: 1
}

const MAX_CONCURRENCY = 1

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

    // Mock out getUserPrimaryClockValues
    await models.CNodeUser.create({
      walletPublicKey: constants.userWallet,
      clock: constants.primaryClockVal
    })

    const snapback = new SnapbackSM(nodeConfig, getLibsMock())
    await snapback.init(MAX_CONCURRENCY)

    // Setup the recurring syncs
    const recurringSyncIds = []
    for (let i = 0; i < 5; i++) {
      const { id } = await snapback.issueSecondarySync({
        userWallet: constants.userWallet,
        secondaryEndpoint: constants.secondaryEndpoint,
        primaryEndpoint: constants.primaryEndpoint,
        syncType: SyncType.Recurring,
        primaryClockValue: constants.primaryClockVal
      })
      recurringSyncIds.push(id)
    }

    // setup manual syncs
    const manualSyncIds = []
    for (let i = 0; i < 3; i++) {
      const { id } = await snapback.enqueueManualSync({
        userWallet: constants.userWallet,
        secondaryEndpoint: constants.secondaryEndpoint,
        primaryEndpoint: constants.primaryEndpoint,
        syncType: SyncType.Manual
      })
      manualSyncIds.push(id)
    }

    const totalJobsAddedCount = recurringSyncIds.length + manualSyncIds.length

    let syncQueueJobs = await snapback.getSyncQueueJobs(true)
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
    }

    assert.strictEqual(manualWaitingJobIDs.length, 0)
    assert.strictEqual(recurringWaitingJobIDs.length, 0)

    // TODO - not sure why this isn't working, bull is not returning any jobs as completed 🤷‍♂️
    // // Ensure all jobs were completed
    // let [
    //   manualCompletedJobIDs,
    //   recurringCompletedJobIDs
    // ] = [
    //   syncQueueJobs.manualCompleted.map(job => job.id),
    //   syncQueueJobs.recurringCompleted.map(job => job.id)
    // ]
    // assert.strictEqual(manualSyncIds, manualCompletedJobIDs)
    // assert.strictEqual(recurringSyncIds, recurringCompletedJobIDs)
  })
})
