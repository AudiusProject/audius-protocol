const nock = require('nock')
const { SnapbackSM, SyncPriority, SyncType } = require('../src/snapbackSM')
const models = require('../src/models')
const { getLibsMock } = require('./lib/libsMock')
const assert = require('assert')
const utils = require('../src/utils')
const { getApp } = require('./lib/app')

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
  })

  afterEach(async function () {
    await server.close()
  })

  it('prioritizes manual syncs', async function () {
    // Mock out the initial call to sync
    nock(constants.secondaryEndpoint)
      .persist()
      .post(() => true)
      .reply(200)

    // Mock out the secondary monitoring response with a 500ms delay
    nock(constants.secondaryEndpoint)
      .persist()
      .get(() => true)
      .delayBody(500)
      .reply(200, { data: { clockValue: constants.primaryClockVal } })

    // Mock out getUserPrimaryClockValues
    await models.CNodeUser.create({
      walletPublicKey: constants.userWallet,
      clock: constants.primaryClockVal
    })

    const snapback = new SnapbackSM(getLibsMock())
    await snapback.init(MAX_CONCURRENCY)

    // Setup the recurring syncs
    const recurringSyncIds = new Set()
    for (let i = 0; i < 5; i++) {
      const { id } = await snapback.issueSecondarySync({
        userWallet: constants.userWallet,
        secondaryEndpoint: constants.secondaryEndpoint,
        primaryEndpoint: constants.primaryEndpoint,
        priority: SyncPriority.Low,
        syncType: SyncType.Manual,
        primaryClockValue: constants.primaryClockVal
      })
      recurringSyncIds.add(id)
    }

    // setup manual syncs
    const manualSyncIds = new Set()
    for (let i = 0; i < 3; i++) {
      const { id } = await snapback.enqueueManualSync({
        userWallet: constants.userWallet,
        secondaryEndpoint: constants.secondaryEndpoint,
        primaryEndpoint: constants.primaryEndpoint,
        priority: SyncPriority.High,
        syncType: SyncType.Manual
      })
      manualSyncIds.add(id)
    }

    // Verify we complete manual jobs first
    let jobIds = (await snapback.getPendingSyncJobs()).map(job => job.id)
    let lastRemainingRecurringCount = 0

    while (jobIds.length) {
      const remainingManualCount = jobIds.filter(id => manualSyncIds.has(id)).length
      const remainingRecurringCount = jobIds.filter(id => recurringSyncIds.has(id)).length
      if (remainingManualCount > 0 && remainingRecurringCount < lastRemainingRecurringCount) {
        assert.fail('Should have done all manual high priority syncs first')
      }

      lastRemainingRecurringCount = remainingRecurringCount

      await utils.timeout(500)
      jobIds = (await snapback.getPendingSyncJobs()).map(job => job.id)
    }
  })
})
