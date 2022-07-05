/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const proxyquire = require('proxyquire')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const {
  SyncType,
  QUEUE_NAMES
} = require('../src/services/stateMachineManager/stateMachineConstants')

chai.use(require('sinon-chai'))

describe('test findSyncRequests job processor', function () {
  let server, sandbox, originalContentNodeEndpoint
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
    config.set('spID', 1)
    originalContentNodeEndpoint = config.get('creatorNodeEndpoint')
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
      primary,
      secondary1,
      secondary2,
      primarySpID,
      secondary1SpID,
      secondary2SpID,
      user_id,
      wallet
    }
  ]

  function getJobProcessorStub(
    getNewOrExistingSyncReqStub,
    getCNodeEndpointToSpIdMapStub
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
        }
      }
    )
  }

  it('returns correct syncs (happy path)', function () {
    // Set variables that satisfy conditions for user1 to be synced from primary1 to secondary1
    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }
    const unhealthyPeers = []
    // Clock value of secondary1 being less than primary means we'll sync from primary to secondary1
    const replicaSetNodesToUserClockStatusesMap = {
      [primary]: {
        [wallet]: 10
      },
      [secondary1]: {
        [wallet]: 9
      },
      [secondary2]: {
        [wallet]: 10
      }
    }
    const userSecondarySyncMetricsMap = {}
    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)
    // Stub successfully finding a new sync to enqueue from primary1 to secondary1
    const expectedSyncReqToEnqueue = 'expectedSyncReqToEnqueue'
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      const { userWallet, secondaryEndpoint, primaryEndpoint, syncType } = args
      if (
        userWallet === wallet &&
        secondaryEndpoint === secondary1 &&
        primaryEndpoint === primary &&
        syncType === SyncType.Recurring
      ) {
        return { syncReqToEnqueue: expectedSyncReqToEnqueue }
      }
      throw new Error(
        'getNewOrExistingSyncReq was not expected to be called with the given args'
      )
    })
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: sync to user1 to secondary1 because its clock value is behind
    expect(
      findSyncRequestsJobProcessor({
        logger,
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      })
    ).to.deep.equal({
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: {
        [QUEUE_NAMES.STATE_RECONCILIATION]: [expectedSyncReqToEnqueue]
      },
      metricsToRecord: [
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_to_sync_to.co',
            result: 'new_sync_request_enqueued'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        },
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_already_synced.co',
            result: 'no_sync_secondary_clock_gte_primary'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        }
      ]
    })
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly({
      userWallet: wallet,
      secondaryEndpoint: secondary1,
      primaryEndpoint: primary,
      syncType: SyncType.Recurring
    })
  })

  it("doesn't enqueue duplicate syncs", function () {
    // Set variables that satisfy conditions for user1 to be synced from primary1 to secondary1
    const primary = 'http://primary_cn.co'
    const secondary1 = 'http://secondary_to_sync_to.co'
    const secondary2 = 'http://secondary_already_synced.co'
    const primarySpID = 1
    const secondary1SpID = 2
    const secondary2SpID = 3
    const user_id = 1
    const wallet = '0x123456789'
    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }
    const users = [
      {
        primary,
        secondary1,
        secondary2,
        primarySpID,
        secondary1SpID,
        secondary2SpID,
        user_id,
        wallet
      }
    ]
    const unhealthyPeers = []
    // Clock value of secondary1 being less than primary means we'll sync from primary to secondary1
    const replicaSetNodesToUserClockStatusesMap = {
      [primary]: {
        [wallet]: 10
      },
      [secondary1]: {
        [wallet]: 9
      },
      [secondary2]: {
        [wallet]: 10
      }
    }
    const userSecondarySyncMetricsMap = {}
    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)
    // Stub having a duplicate sync so that no new sync will be enqueued
    const expectedDuplicateSyncReq = 'expectedDuplicateSyncReq'
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      const { userWallet, secondaryEndpoint, primaryEndpoint, syncType } = args
      if (
        userWallet === wallet &&
        secondaryEndpoint === secondary1 &&
        primaryEndpoint === primary &&
        syncType === SyncType.Recurring
      ) {
        return { duplicateSyncReq: expectedDuplicateSyncReq }
      }
      throw new Error(
        'getNewOrExistingSyncReq was not expected to be called with the given args'
      )
    })
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: sync to user1 to secondary1 doesn't happen because a duplicate is already in the queue
    expect(
      findSyncRequestsJobProcessor({
        logger,
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      })
    ).to.deep.equal({
      duplicateSyncReqs: [expectedDuplicateSyncReq],
      errors: [],
      jobsToEnqueue: {},
      metricsToRecord: [
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_to_sync_to.co',
            result: 'sync_request_already_enqueued'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        },
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_already_synced.co',
            result: 'no_sync_secondary_clock_gte_primary'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        }
      ]
    })
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly({
      userWallet: wallet,
      secondaryEndpoint: secondary1,
      primaryEndpoint: primary,
      syncType: SyncType.Recurring
    })
  })

  it("doesn't sync to unhealthy secondaries", function () {
    // Set variables that satisfy conditions for user1 to be synced from primary1 to secondary1 (except being healthy)
    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }
    // Mark secondary1 as healthy so it won't sync to it
    const unhealthyPeers = [secondary1]
    // Clock value of secondary1 being less than primary means we would sync from primary to secondary1 if secondary1 is healthy
    const replicaSetNodesToUserClockStatusesMap = {
      [primary]: {
        [wallet]: 10
      },
      [secondary1]: {
        [wallet]: 9
      },
      [secondary2]: {
        [wallet]: 10
      }
    }
    const userSecondarySyncMetricsMap = {}
    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)
    // Stub finding syncs never being called because it should short-circuit first when seeing secondary1 is unhealthy
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('getNewOrExistingSyncReq was not expected to be called')
    })
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: no syncs because secondary1 would normally sync but it's unhealthy
    expect(
      findSyncRequestsJobProcessor({
        logger,
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      })
    ).to.deep.equal({
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: {},
      metricsToRecord: [
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_to_sync_to.co',
            result: 'no_sync_already_marked_unhealthy'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        },
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_already_synced.co',
            result: 'no_sync_secondary_clock_gte_primary'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        }
      ]
    })
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  it("doesn't sync if spId is mismatched in cNodeEndpointToSpId mapping", function () {
    // Set variables that satisfy conditions for user1 to be synced from primary1 to secondary1 (except spId matching)
    // Make secondary1's spId in mapping NOT match the spId in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID + 100,
      [secondary2]: secondary2SpID
    }
    const unhealthyPeers = []
    // Clock value of secondary1 being less than primary means we would sync from primary to secondary1 if spId matched
    const replicaSetNodesToUserClockStatusesMap = {
      [primary]: {
        [wallet]: 10
      },
      [secondary1]: {
        [wallet]: 9
      },
      [secondary2]: {
        [wallet]: 10
      }
    }
    const userSecondarySyncMetricsMap = {}
    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)
    // Stub finding syncs never being called because it should short-circuit first when seeing secondary1 spId mismatches
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('getNewOrExistingSyncReq was not expected to be called')
    })
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: no syncs because secondary1 would normally sync but its spId mismatches
    expect(
      findSyncRequestsJobProcessor({
        logger,
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      })
    ).to.deep.equal({
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: {},
      metricsToRecord: [
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_to_sync_to.co',
            result: 'no_sync_sp_id_mismatch'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        },
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_already_synced.co',
            result: 'no_sync_secondary_clock_gte_primary'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        }
      ]
    })
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  it("doesn't sync if success rate is too low", function () {
    // Set variables that satisfy conditions for user1 to be synced from primary1 to secondary1 (except success rate)
    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }
    const unhealthyPeers = []
    // Clock value of secondary1 being less than primary means we would sync from primary to secondary1 if success rate were higher
    const replicaSetNodesToUserClockStatusesMap = {
      [primary]: {
        [wallet]: 10
      },
      [secondary1]: {
        [wallet]: 9
      },
      [secondary2]: {
        [wallet]: 10
      }
    }
    // Make success rate lower than threshold
    const userSecondarySyncMetricsMap = {
      [wallet]: {
        [secondary1]: { successRate: 0, failureCount: 100 },
        [secondary2]: { successRate: 1, failureCount: 0 }
      }
    }
    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)
    // Stub  finding syncs never being called because it should short-circuit first when seeing low secondary1 success rate
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('getNewOrExistingSyncReq was not expected to be called')
    })
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: no syncs because secondary1 would normally sync but its success rate is low
    expect(
      findSyncRequestsJobProcessor({
        logger,
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      })
    ).to.deep.equal({
      duplicateSyncReqs: [],
      errors: [],
      jobsToEnqueue: {},
      metricsToRecord: [
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_to_sync_to.co',
            result: 'no_sync_success_rate_too_low'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        },
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_already_synced.co',
            result: 'no_sync_secondary_clock_gte_primary'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        }
      ]
    })
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  it('catches errors from finding syncs', function () {
    // Set variables that satisfy conditions for user1 to be synced from primary1 to secondary1
    // spIds in mapping must match those in the `users` variable
    const cNodeEndpointToSpIdMap = {
      [primary]: primarySpID,
      [secondary1]: secondary1SpID,
      [secondary2]: secondary2SpID
    }
    const unhealthyPeers = []
    // Clock value of secondary1 being less than primary means we'll sync from primary to secondary1
    const replicaSetNodesToUserClockStatusesMap = {
      [primary]: {
        [wallet]: 10
      },
      [secondary1]: {
        [wallet]: 9
      },
      [secondary2]: {
        [wallet]: 10
      }
    }
    const userSecondarySyncMetricsMap = {}
    // This node must be the primary in order to sync
    config.set('creatorNodeEndpoint', primary)
    // Stub error when trying to find a new sync to enqueue from primary1 to secondary1
    const expectedErrorMsg = 'expectedErrorMsg'
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error(expectedErrorMsg)
    })
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }

    const findSyncRequestsJobProcessor = getJobProcessorStub(
      getNewOrExistingSyncReqStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: sync to secondary1 errors, sync to secondary2 fails because it's already synced
    expect(
      findSyncRequestsJobProcessor({
        logger,
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      })
    ).to.deep.equal({
      duplicateSyncReqs: [],
      errors: [
        `Error getting new or existing sync request for user ${wallet} and secondary ${secondary1} - ${expectedErrorMsg}`
      ],
      jobsToEnqueue: {},
      metricsToRecord: [
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_to_sync_to.co',
            result: 'no_sync_unexpected_error'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        },
        {
          metricLabels: {
            primary: 'http://primary_cn.co',
            secondary: 'http://secondary_already_synced.co',
            result: 'no_sync_secondary_clock_gte_primary'
          },
          metricName: 'audius_cn_find_syncs_results_total',
          metricType: 'GAUGE_INC',
          metricValue: 1
        }
      ]
    })
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly({
      userWallet: wallet,
      secondaryEndpoint: secondary1,
      primaryEndpoint: primary,
      syncType: SyncType.Recurring
    })
  })
})
