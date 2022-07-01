/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const proxyquire = require('proxyquire')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const {
  QUEUE_NAMES,
  JOB_NAMES
} = require('../src/services/stateMachineManager/stateMachineConstants')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

describe('test findReplicaSetUpdates job processor', function () {
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
    logger = null
  })

  const primary = 'http://primary_cn.co'
  const secondary1 = 'http://secondary1.co'
  const secondary2 = 'http://secondary2.co'
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

  const DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP = {
    [primary]: primarySpID,
    [secondary1]: secondary1SpID,
    [secondary2]: secondary2SpID
  }

  const CNODE_ENDOINT_TO_SP_ID_MAP_WHERE_SECONDARY1_MISMATCHES = {
    [primary]: primarySpID,
    [secondary1]: secondary1SpID + 100,
    [secondary2]: secondary2SpID
  }

  const DEFAULT_CLOCK_STATUSES_MAP = {
    [primary]: {
      [wallet]: 10,
      randomWallet: 10
    },
    [secondary1]: {
      [wallet]: 10,
      anotherWallet: 100
    },
    [secondary2]: {
      [wallet]: 10
    },
    unusedNode: {}
  }

  const CLOCK_STATUSES_MAP_FILTERED_TO_WALLET = {
    [primary]: 10,
    [secondary1]: 10,
    [secondary2]: 10
  }

  function getJobProcessorStub(
    isPrimaryHealthyStub,
    getCNodeEndpointToSpIdMapStub
  ) {
    return proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/findReplicaSetUpdates.jobProcessor.js',
      {
        '../../../config': config,
        '../CNodeHealthManager': {
          isPrimaryHealthy: isPrimaryHealthyStub
        },
        '../CNodeToSpIdMapManager': {
          getCNodeEndpointToSpIdMap: getCNodeEndpointToSpIdMapStub
        }
      }
    )
  }

  async function runJobProcessor({
    cNodeEndpointToSpIdMap = DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP,
    userSecondarySyncMetricsMap = {},
    unhealthyPeers = [],
    isPrimaryHealthyInExtraHealthCheck = true
  }) {
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const isPrimaryHealthyStub = sandbox
      .stub()
      .resolves(isPrimaryHealthyInExtraHealthCheck)

    const findReplicaSetUpdatesJobProcessor = getJobProcessorStub(
      isPrimaryHealthyStub,
      getCNodeEndpointToSpIdMapStub
    )

    // Verify job outputs the correct results: primary should be removed from replica set because it's unhealthy
    return findReplicaSetUpdatesJobProcessor({
      logger,
      users,
      unhealthyPeers,
      replicaSetNodesToUserClockStatusesMap: DEFAULT_CLOCK_STATUSES_MAP,
      userSecondarySyncMetricsMap
    })
  }

  async function runAndVerifyJobProcessor({
    expectedUnhealthyReplicas = [],
    jobProcessorArgs = {}
  }) {
    return expect(
      runJobProcessor(jobProcessorArgs)
    ).to.eventually.be.fulfilled.and.deep.equal({
      cNodeEndpointToSpIdMap:
        jobProcessorArgs?.cNodeEndpointToSpIdMap ||
        DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP,
      jobsToEnqueue: expectedUnhealthyReplicas?.length
        ? {
            [QUEUE_NAMES.STATE_RECONCILIATION]: [
              {
                jobName: JOB_NAMES.UPDATE_REPLICA_SET,
                jobData: {
                  wallet,
                  userId: user_id,
                  primary,
                  secondary1,
                  secondary2,
                  unhealthyReplicas: expectedUnhealthyReplicas,
                  replicaSetNodesToUserClockStatusesMap:
                    CLOCK_STATUSES_MAP_FILTERED_TO_WALLET
                }
              }
            ]
          }
        : {}
    })
  }

  it('issues update for mismatched spIds when this node is primary', async function () {
    // Make this node be the user's primary
    config.set('creatorNodeEndpoint', primary)

    // Verify job outputs the correct results: secondary1 should be removed from replica set because its spId mismatches
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        cNodeEndpointToSpIdMap:
          CNODE_ENDOINT_TO_SP_ID_MAP_WHERE_SECONDARY1_MISMATCHES
      },
      expectedUnhealthyReplicas: [secondary1]
    })
  })

  it('issues update for mismatched spIds when this node is secondary', async function () {
    // Make this node be the user's secondary
    config.set('creatorNodeEndpoint', secondary2)

    // Verify job outputs the correct results: secondary1 should be removed from replica set because its spId mismatches
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        cNodeEndpointToSpIdMap:
          CNODE_ENDOINT_TO_SP_ID_MAP_WHERE_SECONDARY1_MISMATCHES
      },
      expectedUnhealthyReplicas: [secondary1]
    })
  })

  it('issues update for unhealthy primary when this node is secondary and primary fails extra health check', async function () {
    // Make this node be the user's secondary
    config.set('creatorNodeEndpoint', secondary1)

    // Verify job outputs the correct results: primary should be removed from replica set because it's unhealthy
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        // Mark a primary as unhealthy to trigger a replica set update (if its extra health check also fails)
        unhealthyPeers: [primary],
        // Make the primary fail the extra health check so it gets removed from the user's replica set
        isPrimaryHealthyInExtraHealthCheck: false
      },
      expectedUnhealthyReplicas: [primary]
    })
  })

  it('does not issue update for unhealthy primary when this node is secondary and primary passes extra health check', async function () {
    // Make this node be the user's secondary
    config.set('creatorNodeEndpoint', secondary1)

    // Verify job outputs the correct results: primary should NOT be removed from replica set because it's unhealthy but passed the extra health check
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        // Mark a primary as unhealthy to trigger a replica set update (if its extra health check also fails)
        unhealthyPeers: [primary],
        // Make the primary pass the extra health check so it doesn't get removed from the user's replica set
        isPrimaryHealthyInExtraHealthCheck: true
      },
      expectedUnhealthyReplicas: null
    })
  })

  it('issues update for node marked unhealthy when this node is primary', async function () {
    // Make this node be the user's primary
    config.set('creatorNodeEndpoint', primary)

    // Verify job outputs the correct results: secondary2 should be removed from replica set because it's unhealthy
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        // Mark a secondary2 as unhealthy to trigger a replica set update
        unhealthyPeers: [secondary2]
      },
      expectedUnhealthyReplicas: [secondary2]
    })
  })

  it('issues update for node marked unhealthy when this node is secondary', async function () {
    // Make this node be the user's secondary
    config.set('creatorNodeEndpoint', secondary1)

    // Verify job outputs the correct results: secondary2 should be removed from replica set because it's unhealthy
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        // Mark a secondary2 as unhealthy to trigger a replica set update
        unhealthyPeers: [secondary2]
      },
      expectedUnhealthyReplicas: [secondary2]
    })
  })

  it('issues update for low sync success when this node is primary', async function () {
    // Make sync success rate lower than threshold
    const userSecondarySyncMetricsMap = {
      [wallet]: {
        [secondary1]: { successRate: 0, successCount: 0, failureCount: 100 },
        [secondary2]: { successRate: 1, successCount: 0, failureCount: 0 }
      }
    }

    // Make this node be the user's primary
    config.set('creatorNodeEndpoint', primary)

    // Verify job outputs the correct results: secondary1 should be removed from replica set because its sync success rate is too low
    return runAndVerifyJobProcessor({
      jobProcessorArgs: {
        userSecondarySyncMetricsMap
      },
      expectedUnhealthyReplicas: [secondary1]
    })
  })
})
