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

  const primary = 'http://primary_cn.co'
  const secondary1 = 'http://secondary_to_sync_to.co'
  const secondary2 = 'http://secondary_already_synced.co'
  const primarySpID = 1
  const secondary1SpID = 2
  const secondary2SpID = 3
  const user_id = 1
  const wallet = '0x123456789'
  const users = [
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
  const syncType = SyncType.Recurring
  const metricName = 'audius_cn_find_sync_request_counts'
  const metricType = 'GAUGE_INC'

  function getJobProcessorStub(
    getNewOrExistingSyncReqStub,
    getCNodeEndpointToSpIdMapStub,
    computeSyncModeForUserAndReplicaStub
  ) {
    return proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/findSyncRequests.jobProcessor.js',
      {
        '../../../config': config,
        '../stateReconciliation/stateReconciliationUtils': {
          getNewOrExistingSyncReq: getNewOrExistingSyncReqStub
        },
        '../CNodeToSpIdMapManager': {
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
    const replicaToUserInfoMap = {
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
    const getNewOrExistingSyncReqExpectedConditionsArr = [{
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
    }]
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
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary1][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary2][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary2][wallet].filesHash
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
        [QUEUE_NAMES.STATE_RECONCILIATION]: [expectedSyncReqToEnqueue]
      },
      metricsToRecord: [
        {
          metricLabels: {
            sync_mode: _.snakeCase(SYNC_MODES.SyncSecondaryFromPrimary),
            result: 'new_sync_request_enqueued_primary_to_secondary'
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
      replicaToUserInfoMap,
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
    const replicaToUserInfoMap = {
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
    const getNewOrExistingSyncReqExpectedConditionsArr = [{
      input: {
        userWallet: wallet,
        primaryEndpoint: primary,
        secondaryEndpoint: secondary1,
        syncType,
        syncMode: SYNC_MODES.SyncSecondaryFromPrimary
      },
      output: { duplicateSyncReq: expectedDuplicateSyncReq }
    }]
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
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary1][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary2][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary2][wallet].filesHash
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
      jobsToEnqueue: {},
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
      replicaToUserInfoMap,
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
    const replicaToUserInfoMap = {
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
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary2][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary2][wallet].filesHash
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
      jobsToEnqueue: {},
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
      replicaToUserInfoMap,
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
    const replicaToUserInfoMap = {
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
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary2][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary2][wallet].filesHash
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
      jobsToEnqueue: {},
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
      replicaToUserInfoMap,
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
    const replicaToUserInfoMap = {
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
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary2][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary2][wallet].filesHash
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
      jobsToEnqueue: {},
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
      replicaToUserInfoMap,
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
    const replicaToUserInfoMap = {
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
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary1][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary1][wallet].filesHash
        },
        output: SYNC_MODES.SyncSecondaryFromPrimary
      },
      {
        input: {
          wallet,
          primaryClock: replicaToUserInfoMap[primary][wallet].clock,
          secondaryClock: replicaToUserInfoMap[secondary2][wallet].clock,
          primaryFilesHash: replicaToUserInfoMap[primary][wallet].filesHash,
          secondaryFilesHash: replicaToUserInfoMap[secondary2][wallet].filesHash
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
      jobsToEnqueue: {},
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
      replicaToUserInfoMap,
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

  it.skip('test for when _findSyncsforUser returns syncReqsToEnqueue and duplicateSyncReqs')

  it.skip('test for when _findSyncsforUser returns syncReqsToEnqueue and errors')

  it.skip('test with multiple users and outcomes')
})
