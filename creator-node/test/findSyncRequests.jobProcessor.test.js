/* eslint-disable no-unused-expressions */
const _ = require('lodash')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const proxyquire = require('proxyquire')
chai.use(require('sinon-chai'))

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const {
  SyncType,
  QUEUE_NAMES,
  SYNC_MODES
} = require('../src/services/stateMachineManager/stateMachineConstants')

describe('test findSyncRequests job processor', function () {
  let server, sandbox, originalContentNodeEndpoint, logger

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()

    config.set('spID', 1)
    originalContentNodeEndpoint = config.get('creatorNodeEndpoint')

    logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }
  })

  afterEach(async function () {
    await server.close()
    sandbox.restore()
    config.set('creatorNodeEndpoint', originalContentNodeEndpoint)
  })

  let primary = 'http://primary_cn.co'
  let secondary1 = 'http://secondary_to_sync_to.co'
  let secondary2 = 'http://secondary_already_synced.co'
  let primarySpID = 1
  let secondary1SpID = 2
  let secondary2SpID = 3
  let user_id = 1
  let wallet = '0x123456789'
  let users = [
    {
      user_id,
      wallet,
      primary,
      secondary1,
      secondary2,
      primarySpID,
      secondary1SpID,
      secondary2SpID
    }
  ]
  let syncType = SyncType.Recurring
  let metricName = 'audius_cn_find_sync_request_counts'
  let metricType = 'GAUGE_INC'

  function getJobProcessorStub(
    getNewOrExistingSyncReqStub,
    getCNodeEndpointToSpIdMapStub,
    computeSyncModeForUserAndReplicaStub
  ) {
    return proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/findSyncRequests.jobProcessor.ts',
      {
        '../../../config': config,
        '../stateReconciliation/stateReconciliationUtils': {
          getNewOrExistingSyncReq: getNewOrExistingSyncReqStub
        },
        '../ContentNodeInfoManager': {
          getCNodeEndpointToSpIdMap: getCNodeEndpointToSpIdMapStub
        },
        './stateMonitoringUtils': {
          computeSyncModeForUserAndReplica: computeSyncModeForUserAndReplicaStub
        }
      }
    )
  }

  /**
   * Creates and returns a stub that fakes a function call given expected input and output conditions
   * The stub throws an error if called with unexpected inputs
   * @param {String} functionName
   * @param {Object[]} expectedConditionsArr - array containing all possible expected conditions for stub
   * @param {Object[]} expectedConditionsArr[].input - expected stubbed function input params
   * @param {Object[]} expectedConditionsArr[].output - expected stubbed function output for above input params
   * @returns stub
   */
  function getConditionalStub(functionName, expectedConditionsArr) {
    const expectedConditions = {}
    expectedConditionsArr.map(({ input, output }) => {
      expectedConditions[JSON.stringify(input)] = output
    })

    const stub = sandbox.stub().callsFake((args) => {
      if (!(JSON.stringify(args) in expectedConditions)) {
        throw new Error(
          `${functionName} was not expected to be called with the given args: ${JSON.stringify(
            args
          )}`
        )
      }

      return expectedConditions[JSON.stringify(args)]
    })

    return stub
  }

  function getGetCNodeEndpointToSpIdMapStub(cNodeEndpointToSpIdMap) {
    const stub = sandbox.stub().returns(cNodeEndpointToSpIdMap)
    return stub
  }

  it('Correctly returns sync from primary to secondary1 when secondary1 clock < primary clock', async function () {
    /**
     * Define all input variables
     */

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }

    const unhealthyPeers = []

    // Since secondary1.wallet.clock < primary.wallet.clock, we will sync from primary to secondary1
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    const expectedSyncReqToEnqueue = 'expectedSyncReqToEnqueue'
    const getNewOrExistingSyncReqExpectedConditionsArr = [
      {
        input: {
          userWallet: wallet,
          primaryEndpoint: primary,
          secondaryEndpoint: secondary1,
          syncType,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary
        },
        /**
         * note - this value can be anything as it's outside scope of this integration test suite
         * TODO - should prob change this to reflect real object
         */
        output: { syncReqToEnqueue: expectedSyncReqToEnqueue }
      }
    ]
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary1][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: sync to user1 to secondary1 because its clock value is behind
     */

    const expectedOutput = {
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: {
        [QUEUE_NAMES.RECURRING_SYNC]: [expectedSyncReqToEnqueue]
      },
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'new_sync_request_enqueued'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly(
      getNewOrExistingSyncReqExpectedConditionsArr[0].input
    )
    expect(computeSyncModeForUserAndReplicaStub)
      .to.have.been.calledTwice.and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[1].input
      )
  })

  it("doesn't enqueue duplicate syncs", async function () {
    /**
     * Define all input variables
     */

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }

    const unhealthyPeers = []

    // Clock value of secondary1 being less than primary means we'll sync from primary to secondary1
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    // Stub having a duplicate sync so that no new sync will be enqueued
    const expectedDuplicateSyncReq = 'expectedDuplicateSyncReq'
    const getNewOrExistingSyncReqExpectedConditionsArr = [
      {
        input: {
          userWallet: wallet,
          primaryEndpoint: primary,
          secondaryEndpoint: secondary1,
          syncType,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary
        },
        output: { duplicateSyncReq: expectedDuplicateSyncReq }
      }
    ]
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary1][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: sync to user1 to secondary1 doesn't happen because a duplicate is already in the queue
     */

    const expectedOutput = {
      duplicateSyncReqs: [expectedDuplicateSyncReq],
      errors: [],
      jobsToEnqueue: undefined,
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'sync_request_already_enqueued'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly(
      getNewOrExistingSyncReqExpectedConditionsArr[0].input
    )
    expect(computeSyncModeForUserAndReplicaStub)
      .to.have.been.calledTwice.and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[1].input
      )
  })

  it("doesn't sync to unhealthy secondaries", async function () {
    /**
     * Define all input variables
     */

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }

    // Mark secondary1 as healthy so it won't sync to it
    const unhealthyPeers = [secondary1]

    // Since secondary1.wallet.clock < primary.wallet.clock, we would sync from primary to secondary1 if it were healthy
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    // Stub getNewOrExistingSyncReq() to never be called since it should short-circuit first when seeing secondary1 is unhealthy
    const getNewOrExistingSyncReqExpectedConditionsArr = []
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: no syncs because secondary1 would normally sync but it's unhealthy
     */

    const expectedOutput = {
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: undefined,
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_already_marked_unhealthy'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    expect(
      computeSyncModeForUserAndReplicaStub
    ).to.have.been.calledOnceWithExactly(
      computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
    )
  })

  it("doesn't sync if spId is mismatched in cNodeEndpointToSpId mapping", async function () {
    /**
     * Define input variables that satisfy conditions for user1 to be synced from primary1 to secondary1 (except spId matching)
     */

    // Make secondary1's spId in mapping NOT match the spId in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID + 100,
      [secondary2]: secondary2SpID
    }

    const unhealthyPeers = []

    // Since secondary1.wallet.clock < primary.wallet.clock, we would sync from primary to secondary1 if spID matched
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    // Stub finding syncs never being called because it should short-circuit first when seeing secondary1 spId mismatches
    const getNewOrExistingSyncReqExpectedConditionsArr = []
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    // stub computeSyncModeForUserAndReplica() only being called with primary-secondary2 pair, since primary-secondary1 processing would short circuit before this call
    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: no syncs because secondary1 would normally sync but its spId mismatches, and secondary2 is already synced
     */

    const expectedOutput = {
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: undefined,
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_sp_id_mismatch'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    expect(
      computeSyncModeForUserAndReplicaStub
    ).to.have.been.calledOnceWithExactly(
      computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
    )
  })

  it("doesn't sync if success rate is too low", async function () {
    /**
     * Define input variables that satisfy conditions for user1 to be synced from primary1 to secondary1 (except success rate)
     */

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }

    const unhealthyPeers = []

    // Since secondary1.wallet.clock < primary.wallet.clock, we would sync from primary to secondary1 if sync success rate were higher
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      }
    }

    // Make sync success rate lower than threshold for secondary1
    const userSecondarySyncMetricsMap = {
      [wallet]: {
        [secondary1]: { successRate: 0, failureCount: 100 },
        [secondary2]: { successRate: 1, failureCount: 0 }
      }
    }

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    // Stub getNewOrExistingSyncReq() never being called because it should short-circuit first when seeing low secondary1 success rate
    const getNewOrExistingSyncReqExpectedConditionsArr = []
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    // stub computeSyncModeForUserAndReplica() only being called with primary-secondary2 pair, since primary-secondary1 processing would short circuit before this call
    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: no syncs because secondary1 would normally sync but its success rate is low
     */
    const expectedOutput = {
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: undefined,
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_success_rate_too_low'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    expect(
      computeSyncModeForUserAndReplicaStub
    ).to.have.been.calledOnceWithExactly(
      computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
    )
  })

  it('catches errors from finding syncs', async function () {
    /**
     * Define input variables that satisfy conditions for user1 to be synced from primary1 to secondary1
     */

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }

    const unhealthyPeers = []

    // Since secondary1.wallet.clock < primary.wallet.clock, we will sync from primary to secondary1
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    // Stub error when trying to find a new sync to enqueue from primary1 to secondary1
    const expectedErrorMsg = 'expectedErrorMsg'
    const getNewOrExistingSyncReqExpectedInput = {
      userWallet: wallet,
      primaryEndpoint: primary,
      secondaryEndpoint: secondary1,
      syncType,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary
    }
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error(expectedErrorMsg)
    })

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    // stub computeSyncModeForUserAndReplica() being called with both primary-secondary1 and primary-secondary2 pairs
    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary1][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: sync to secondary1 errors, sync to secondary2 fails because it's already synced
     */
    const expectedOutput = {
      duplicateSyncReqs: [],
      errors: [
        `Error getting new or existing sync request for syncMode ${SYNC_MODES.SyncSecondaryFromPrimary}, user ${wallet} and secondary ${secondary1} - ${expectedErrorMsg}`
      ],
      jobsToEnqueue: undefined,
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'no_sync_unexpected_error'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly(
      getNewOrExistingSyncReqExpectedInput
    )
    expect(computeSyncModeForUserAndReplicaStub)
      .to.have.been.calledTwice.and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[1].input
      )
  })

  it('test for when _findSyncsforUser returns syncReqsToEnqueue and duplicateSyncReqs', async function () {
    /**
     * Define all input variables
     */

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }

    const unhealthyPeers = []

    // Both secondaries are behind -> will enqueue syncs to both
    const replicaToAllUserInfoMaps = {
      [primary]: {
        [wallet]: { clock: 10, filesHash: '0xabc' }
      },
      [secondary1]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      },
      [secondary2]: {
        [wallet]: { clock: 9, filesHash: '0xnotabc' }
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)

    /**
     * Create all stubs for jobProcessor
     */

    // Mock `getNewOrExistingSyncReq()` to return expectedSyncReq for secondary1 and duplicateSyncReq for secondary2
    const expectedSyncReqToEnqueue = 'expectedSyncReqToEnqueue'
    const expectedDuplicateSyncReq = 'expectedDuplicateSyncReq'
    const getNewOrExistingSyncReqExpectedConditionsArr = [
      {
        input: {
          userWallet: wallet,
          primaryEndpoint: primary,
          secondaryEndpoint: secondary1,
          syncType,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary
        },
        output: { syncReqToEnqueue: expectedSyncReqToEnqueue }
      },
      {
        input: {
          userWallet: wallet,
          primaryEndpoint: primary,
          secondaryEndpoint: secondary2,
          syncType,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary
        },
        output: { duplicateSyncReq: expectedDuplicateSyncReq }
      }
    ]
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary1][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToAllUserInfoMaps[primary][wallet].clock,
          secondaryClock: replicaToAllUserInfoMaps[secondary2][wallet].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[primary][wallet].filesHash,
          secondaryFilesHash:
            replicaToAllUserInfoMaps[secondary2][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: sync to user1 to secondary1 because its clock value is behind
     */

    const expectedOutput = {
      duplicateSyncReqs: [expectedDuplicateSyncReq],
      errors: [],
      jobsToEnqueue: {
        [QUEUE_NAMES.RECURRING_SYNC]: [expectedSyncReqToEnqueue]
      },
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'new_sync_request_enqueued'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'sync_request_already_enqueued'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(getNewOrExistingSyncReqStub)
      .to.have.been.calledWithExactly(
        getNewOrExistingSyncReqExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        getNewOrExistingSyncReqExpectedConditionsArr[1].input
      )
    expect(computeSyncModeForUserAndReplicaStub)
      .to.have.been.calledTwice.and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[1].input
      )
  })

  it('Test with multiple users and outcomes, including MergePrimaryAndSecondary', async function () {
    /**
     * Define all input variables
     */

    const CN1 = 'http://cn1.co'
    const CN2 = 'http://cn2.co'
    const CN3 = 'http://cn3.co'
    const CN1SpID = 1
    const CN2SpID = 2
    const CN3SpID = 3
    const userID1 = 1
    const userID2 = 2
    const wallet1 = '0xwallet1'
    const wallet2 = '0xwallet2'

    users = [
      {
        user_id: userID1,
        wallet: wallet1,
        primary: CN1,
        secondary1: CN2,
        secondary2: CN3,
        primarySpID: CN1SpID,
        secondary1SpID: CN2SpID,
        secondary2SpID: CN3SpID
      },
      {
        user_id: userID2,
        wallet: wallet2,
        primary: CN1,
        secondary1: CN3,
        secondary2: CN2,
        primarySpID: CN1SpID,
        secondary1SpID: CN3SpID,
        secondary2SpID: CN2SpID
      }
    ]

    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [CN1]: CN1SpID,
      [CN2]: CN2SpID,
      [CN3]: CN3SpID
    }

    const unhealthyPeers = []

    // wallet1 - primary (CN1) clock value > secondary1 (CN2) clock value
    // wallet2 - primary (CN1) files hash != secondary1 (CN3) files hash with same clock val
    const replicaToAllUserInfoMaps = {
      [CN1]: {
        [wallet1]: { clock: 10, filesHash: '0xW1C10FH' }, // primary
        [wallet2]: { clock: 10, filesHash: '0xW2C10FH' } // primary
      },
      [CN2]: {
        [wallet1]: { clock: 9, filesHash: '0xW1C9FH' }, // secondary1
        [wallet2]: { clock: 10, filesHash: '0xW2C10FH' } // secondary2
      },
      [CN3]: {
        [wallet1]: { clock: 10, filesHash: '0xW1C10FH' }, // secondary2
        [wallet2]: { clock: 10, filesHash: '0xW2C10BadFH' } // secondary1
      }
    }

    const userSecondarySyncMetricsMap = {}

    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', CN1)

    /**
     * Create all stubs for jobProcessor
     */

    const getCNodeEndpointToSpIdMapStub = getGetCNodeEndpointToSpIdMapStub(
      cNodeEndpointToSpIdMap
    )

    const computeSyncModeForUserAndReplicaExpectedConditionsArr = [
      // wallet1 - (primary, secondary1) = (CN1, CN2) -> SyncSecondaryFromPrimary
      {
        input: {
          wallet: wallet1,
          primaryClock: replicaToAllUserInfoMaps[CN1][wallet1].clock,
          secondaryClock: replicaToAllUserInfoMaps[CN2][wallet1].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[CN1][wallet1].filesHash,
          secondaryFilesHash: replicaToAllUserInfoMaps[CN2][wallet1].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      // wallet1 - (primary, secondary2) = (CN1, CN3) -> None
      {
        input: {
          wallet: wallet1,
          primaryClock: replicaToAllUserInfoMaps[CN1][wallet1].clock,
          secondaryClock: replicaToAllUserInfoMaps[CN3][wallet1].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[CN1][wallet1].filesHash,
          secondaryFilesHash: replicaToAllUserInfoMaps[CN3][wallet1].filesHash
        },
        output: SYNC_MODES.None
      },
      // wallet2 - (primary, secondary1) = (CN1, CN3) -> MergePrimaryAndSecondary
      {
        input: {
          wallet: wallet2,
          primaryClock: replicaToAllUserInfoMaps[CN1][wallet2].clock,
          secondaryClock: replicaToAllUserInfoMaps[CN3][wallet2].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[CN1][wallet2].filesHash,
          secondaryFilesHash: replicaToAllUserInfoMaps[CN3][wallet2].filesHash
        },
        output: SYNC_MODES.MergePrimaryAndSecondary
      },
      // wallet2 - (primary, secondary2) = (CN1, CN2) -> None
      {
        input: {
          wallet: wallet2,
          primaryClock: replicaToAllUserInfoMaps[CN1][wallet2].clock,
          secondaryClock: replicaToAllUserInfoMaps[CN2][wallet2].clock,
          primaryFilesHash: replicaToAllUserInfoMaps[CN1][wallet2].filesHash,
          secondaryFilesHash: replicaToAllUserInfoMaps[CN2][wallet2].filesHash
        },
        output: SYNC_MODES.None
      }
    ]
    const computeSyncModeForUserAndReplicaStub = getConditionalStub(
      'computeSyncModeForUserAndReplica',
      computeSyncModeForUserAndReplicaExpectedConditionsArr
    )

    const expectedSyncReqToEnqueueWallet1 = 'expectedSyncReqToEnqueueWallet1'
    const expectedSyncReqToEnqueueWallet2 = 'expectedSyncReqToEnqueueWallet2'
    const getNewOrExistingSyncReqExpectedConditionsArr = [
      // wallet1
      {
        input: {
          userWallet: wallet1,
          primaryEndpoint: CN1,
          secondaryEndpoint: CN2,
          syncType,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary
        },
        output: { syncReqToEnqueue: expectedSyncReqToEnqueueWallet1 }
      }, // wallet2
      {
        input: {
          userWallet: wallet2,
          primaryEndpoint: CN1,
          secondaryEndpoint: CN3,
          syncType,
          syncMode: SYNC_MODES.MergePrimaryAndSecondary
        },
        output: { syncReqToEnqueue: expectedSyncReqToEnqueueWallet2 }
      }
    ]
    const getNewOrExistingSyncReqStub = getConditionalStub(
      'getNewOrExistingSyncReq',
      getNewOrExistingSyncReqExpectedConditionsArr
    )

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub,
      computeSyncModeForUserAndReplicaStub
    )

    /**
     * Verify job outputs the correct results: sync to user1 to secondary1 because its clock value is behind
     */

    const expectedOutput = {
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: {
        [QUEUE_NAMES.RECURRING_SYNC]: [
          expectedSyncReqToEnqueueWallet1,
          expectedSyncReqToEnqueueWallet2
        ]
      },
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'new_sync_request_enqueued'
          },
          metricName,
          metricType,
          metricValue: 1
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.None),
            result: 'no_sync_secondary_data_matches_primary'
          },
          metricName,
          metricType,
          metricValue: 2
        },
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.MergePrimaryAndSecondary),
            result: 'new_sync_request_enqueued'
          },
          metricName,
          metricType,
          metricValue: 1
        }
      ]
    }
    const actualOutput = await findSyncRequestsJobProcessor({
      users,
      unhealthyPeers,
      replicaToAllUserInfoMaps,
      userSecondarySyncMetricsMap,
      logger
    })
    expect(actualOutput).to.deep.equal(expectedOutput)
    expect(computeSyncModeForUserAndReplicaStub)
      .to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[1].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[2].input
      )
      .and.to.have.been.calledWithExactly(
        computeSyncModeForUserAndReplicaExpectedConditionsArr[3].input
      )
    expect(getNewOrExistingSyncReqStub)
      .to.have.been.calledWithExactly(
        getNewOrExistingSyncReqExpectedConditionsArr[0].input
      )
      .and.to.have.been.calledWithExactly(
        getNewOrExistingSyncReqExpectedConditionsArr[1].input
      )
  })
})
