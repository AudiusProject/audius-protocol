import assert from 'assert'

import { SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES } from '../src/services/stateMachineManager/stateReconciliation/SecondarySyncHealthTrackerConstants'

const { getLibsMock } = require('./lib/libsMock')
const { getApp } = require('./lib/app')

const {
  SecondarySyncHealthTracker
} = require('../src/services/stateMachineManager/stateReconciliation/SecondarySyncHealthTracker.ts')

describe('test secondarySyncHealthTracker', function () {
  let app
  let server: any

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    app = appInfo.app
    server = appInfo.server

    await app.get('redisClient').flushdb()
  })

  afterEach(async function () {
    await server.close()
  })

  it('should record a failure for a given wallet on a secondary', async function () {
    const wallet = '0xadD36aaa12002f1097Cdb7eE24085C28e9random'
    const secondary = 'http://secondary1.co'
    const prometheusError = 'failure_fetching_user_replica_set'

    const secondarySyncHealthTracker = new SecondarySyncHealthTracker()
    await secondarySyncHealthTracker.recordFailure({
      secondary,
      wallet,
      prometheusError
    })

    await secondarySyncHealthTracker.computeWalletOnSecondaryExceedsMaxErrorsAllowed(
      [
        {
          secondary1: secondary,
          wallet
        }
      ]
    )

    assert.deepEqual(
      secondarySyncHealthTracker.doesWalletOnSecondaryExceedMaxErrorsAllowed(
        wallet,
        secondary
      ),
      false
    )
  })

  it('should record different failures for a given wallet on a secondary', async function () {
    const wallet = '0xadD36aaa12002f1097Cdb7eE24085C28e9random'
    const secondary = 'http://secondary1.co'

    const secondarySyncHealthTracker = new SecondarySyncHealthTracker()
    await secondarySyncHealthTracker.recordFailure({
      secondary,
      wallet,
      prometheusError: 'failure_fetching_user_replica_set'
    })

    await secondarySyncHealthTracker.recordFailure({
      secondary,
      wallet,
      prometheusError: 'failure_db_transaction'
    })

    await secondarySyncHealthTracker.computeWalletOnSecondaryExceedsMaxErrorsAllowed(
      [
        {
          secondary1: secondary,
          wallet
        }
      ]
    )

    assert.deepEqual(
      secondarySyncHealthTracker.doesWalletOnSecondaryExceedMaxErrorsAllowed(
        wallet,
        secondary
      ),
      false
    )
  })

  it('if wallet encountered max errors for one error, wallet on secondary exceeded max errors', async function () {
    const wallet = '0xadD36aaa12002f1097Cdb7eE24085C28e9random'
    const secondary = 'http://secondary1.co'

    const secondarySyncHealthTracker = new SecondarySyncHealthTracker()

    const maxRetriesForError =
      SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES.failure_fetching_user_replica_set

    let i = 0
    while (i++ < maxRetriesForError) {
      await secondarySyncHealthTracker.recordFailure({
        secondary,
        wallet,
        prometheusError: 'failure_fetching_user_replica_set'
      })
    }

    await secondarySyncHealthTracker.recordFailure({
      secondary,
      wallet,
      prometheusError: 'failure_db_transaction'
    })

    await secondarySyncHealthTracker.computeWalletOnSecondaryExceedsMaxErrorsAllowed(
      [
        {
          secondary1: secondary,
          wallet
        }
      ]
    )

    assert.deepEqual(
      secondarySyncHealthTracker.doesWalletOnSecondaryExceedMaxErrorsAllowed(
        wallet,
        secondary
      ),
      true
    )
  })

  it('passing in the secondarySyncHealthTrackerState state properly instantiates the constructor', async function () {
    const wallet = '0xadD36aaa12002f1097Cdb7eE24085C28e9random'
    const secondary = 'http://secondary1.co'

    const secondarySyncHealthTracker = new SecondarySyncHealthTracker()

    const maxRetriesForError =
      SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES.failure_fetching_user_replica_set

    let i = 0
    while (i++ < maxRetriesForError) {
      await secondarySyncHealthTracker.recordFailure({
        secondary,
        wallet,
        prometheusError: 'failure_fetching_user_replica_set'
      })
    }

    await secondarySyncHealthTracker.recordFailure({
      secondary,
      wallet,
      prometheusError: 'failure_db_transaction'
    })

    await secondarySyncHealthTracker.computeWalletOnSecondaryExceedsMaxErrorsAllowed(
      [
        {
          secondary1: secondary,
          wallet
        }
      ]
    )

    const secondarySyncHealthTrackerState =
      await secondarySyncHealthTracker.getState()

    // Passing in the a secondarySyncHealthTrackerState should allow another
    // instance to properly parse data. This method is used in handling jobs that have
    // serialized data
    const secondarySyncHealthTracker2 = new SecondarySyncHealthTracker(
      secondarySyncHealthTrackerState
    )

    assert.deepEqual(
      secondarySyncHealthTracker2.doesWalletOnSecondaryExceedMaxErrorsAllowed(
        wallet,
        secondary
      ),
      true
    )
  })
})
