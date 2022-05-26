/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')
const _ = require('lodash')

const config = require('../src/config')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const NodeHealthManager = require('../src/services/stateMachineManager/nodeHealthManager')
const CNodeToSpIdMapManager = require('../src/services/stateMachineManager/cNodeToSpIdMapManager')

describe('test processStateMonitoringJob', function () {
  let server,
    sandbox,
    getNodeUsersStub,
    getUnhealthyPeersStub,
    buildReplicaSetNodesToUserWalletsMapStub,
    retrieveClockStatusesForUsersAcrossReplicaSetStub,
    computeUserSecondarySyncSuccessRatesMapStub,
    aggregateReconfigAndPotentialSyncOpsStub,
    getCNodeEndpointToSpIdMapStub
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
    config.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
    sandbox.restore()

    getNodeUsersStub = null
    getUnhealthyPeersStub = null
    buildReplicaSetNodesToUserWalletsMapStub = null
    retrieveClockStatusesForUsersAcrossReplicaSetStub = null
    computeUserSecondarySyncSuccessRatesMapStub = null
    aggregateReconfigAndPotentialSyncOpsStub = null
    getCNodeEndpointToSpIdMapStub = null
  })

  const JOB_ID = 9
  const LAST_PROCESSED_USER_ID = 5
  const NUM_USERS_TO_PROCESS = 4
  const DISCOVERY_NODE_ENDPOINT = 'http://default_dn1.co'
  const CONTENT_NODE_ENDPOINT = 'http://default_cn1.co'
  const USER_ID = 999
  const USERS = [{ user_id: USER_ID }]
  const UNHEALTHY_PEERS = new Set(['testUnhealthyPeer'])
  const REPLICA_SET_NODES_TO_USER_WALLETS_MAP = {
    'http://healthCn1.co': ['wallet1']
  }
  const REPLICAS_TO_USER_CLOCK_STATUS_MAP = {
    'http://healthCn1.co': { wallet1: 1 }
  }
  const RETRIEVE_CLOCK_STATUS_EXTRA_UNHEALTHY_PEERS = new Set()
  const RETRIEVE_CLOCK_STATUSES_FOR_USERS_ACROSS_REPLICA_SET_RESP = {
    replicasToUserClockStatusMap: REPLICAS_TO_USER_CLOCK_STATUS_MAP,
    unhealthyPeers: RETRIEVE_CLOCK_STATUS_EXTRA_UNHEALTHY_PEERS
  }
  const USER_SECONDARY_SYNC_SUCCESS_RATES_MAP = { dummyMap: 'dummyMap' }
  const REQUIRED_UPDATE_REPLICA_SET_OPS = []
  const POTENTIAL_SYNC_REQUESTS = []
  const AGGREGATE_RECONFIG_AND_POTENTIAL_SYNC_OPS = {
    requiredUpdateReplicaSetOps: REQUIRED_UPDATE_REPLICA_SET_OPS,
    potentialSyncRequests: POTENTIAL_SYNC_REQUESTS
  }
  const CNODE_ENDPOINT_TO_SP_ID_MAP = { dummyCNodeMap: 'dummyCNodeMap' }

  // Return processStateMonitoringJob with each step stubbed to return
  // the given params or default values
  function makeProcessStateMonitoringJob({
    users = USERS,
    unhealthyPeers = UNHEALTHY_PEERS,
    replicaSetNodesToUserWalletsMap = REPLICA_SET_NODES_TO_USER_WALLETS_MAP,
    retrieveClockStatusesForUsersAcrossReplicaSetResp = RETRIEVE_CLOCK_STATUSES_FOR_USERS_ACROSS_REPLICA_SET_RESP,
    userSecondarySyncSuccessRatesMap = USER_SECONDARY_SYNC_SUCCESS_RATES_MAP,
    aggregateReconfigAndPotentialSyncOps = AGGREGATE_RECONFIG_AND_POTENTIAL_SYNC_OPS,
    cNodeEndpointToSpIdMap = CNODE_ENDPOINT_TO_SP_ID_MAP
  }) {
    // Make the stubs return the given params if they're not already set
    if (!getNodeUsersStub) {
      getNodeUsersStub = sandbox.stub().resolves(users)
    }
    if (!getUnhealthyPeersStub) {
      getUnhealthyPeersStub = sandbox.stub().resolves(unhealthyPeers)
    }
    if (!buildReplicaSetNodesToUserWalletsMapStub) {
      buildReplicaSetNodesToUserWalletsMapStub = sandbox
        .stub()
        .returns(replicaSetNodesToUserWalletsMap)
    }
    if (!retrieveClockStatusesForUsersAcrossReplicaSetStub) {
      retrieveClockStatusesForUsersAcrossReplicaSetStub = sandbox
        .stub()
        .resolves(retrieveClockStatusesForUsersAcrossReplicaSetResp)
    }
    if (!computeUserSecondarySyncSuccessRatesMapStub) {
      computeUserSecondarySyncSuccessRatesMapStub = sandbox
        .stub()
        .resolves(userSecondarySyncSuccessRatesMap)
    }
    if (!aggregateReconfigAndPotentialSyncOpsStub) {
      aggregateReconfigAndPotentialSyncOpsStub = sandbox
        .stub()
        .resolves(aggregateReconfigAndPotentialSyncOps)
    }
    if (!getCNodeEndpointToSpIdMapStub) {
      getCNodeEndpointToSpIdMapStub = sandbox
        .stub()
        .returns(cNodeEndpointToSpIdMap)
    }

    // Make processStateMonitoringJob.js's imports return our stubs
    NodeHealthManager.getUnhealthyPeers = getUnhealthyPeersStub
    CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap =
      getCNodeEndpointToSpIdMapStub
    return proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/processStateMonitoringJob.js',
      {
        '../../../config': config,
        './stateMonitoringUtils': {
          getNodeUsers: getNodeUsersStub,
          buildReplicaSetNodesToUserWalletsMap:
            buildReplicaSetNodesToUserWalletsMapStub,
          computeUserSecondarySyncSuccessRatesMap:
            computeUserSecondarySyncSuccessRatesMapStub,
          aggregateReconfigAndPotentialSyncOps:
            aggregateReconfigAndPotentialSyncOpsStub
        },
        '../nodeHealthManager': NodeHealthManager,
        '../cNodeToSpIdMapManager': CNodeToSpIdMapManager,
        '../stateMachineUtils': {
          retrieveClockStatusesForUsersAcrossReplicaSet:
            retrieveClockStatusesForUsersAcrossReplicaSetStub
        }
      }
    )
  }

  // Return the promise created from running processStateMonitoringJob with the given params
  // and with each step mocked to the given steps (or default mocked steps above)
  function processStateMonitoringJob({
    jobId = JOB_ID,
    lastProcessedUserId = LAST_PROCESSED_USER_ID,
    discoveryNodeEndpoint = DISCOVERY_NODE_ENDPOINT,
    contentNodeEndpoint = CONTENT_NODE_ENDPOINT,
    numUsersToProcess = NUM_USERS_TO_PROCESS,
    steps = {}
  }) {
    config.set('creatorNodeEndpoint', contentNodeEndpoint)
    config.set('snapbackUsersPerJob', numUsersToProcess)
    const jobFunc = makeProcessStateMonitoringJob({ ...steps })
    return jobFunc(jobId, lastProcessedUserId, discoveryNodeEndpoint, 0, 0)
  }

  it('should process the correct number of users and resolve successfully', async function () {
    // Set constants and generate the users to process
    const lastProcessedUserId = 200
    const numUsersToProcess = 100
    const users = []
    _.range(
      lastProcessedUserId,
      lastProcessedUserId + numUsersToProcess
    ).forEach((userId) => {
      users.push({
        user_id: userId,
        wallet: `wallet${userId}`,
        primary: 'http://cn1.co',
        secondary1: 'http://cn2.co',
        secondary2: 'http://cn3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      })
    })

    // Verify that the state monitoring job processed `usersToProcess` users
    return expect(
      processStateMonitoringJob({
        lastProcessedUserId,
        numUsersToProcess,
        steps: { users }
      })
    ).to.eventually.be.fulfilled.and.deep.equal({
      lastProcessedUserId: lastProcessedUserId + numUsersToProcess - 1,
      jobFailed: false
    })
  })

  it('should loop back to userId 0 when getNodeUsers returns empty', async function () {
    // Call processStateMonitoringJob with each step succeeding and getNodeUsers returning an empty array
    const jobResult = await processStateMonitoringJob({
      steps: { users: [] }
    })

    // Verify that the job succeeds and returns userId=0 as the last processed user
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: 0,
      jobFailed: false
    })
  })

  it('should call the steps and return required syncs/updates without throwing', async function () {
    // Run processStateMonitoringJob with each step succeeding
    const jobResult = await processStateMonitoringJob({})

    // Verify that each step was called with the expected params
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(USERS)
    expect(
      buildReplicaSetNodesToUserWalletsMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(
      retrieveClockStatusesForUsersAcrossReplicaSetStub
    ).to.have.been.calledOnceWithExactly(REPLICA_SET_NODES_TO_USER_WALLETS_MAP)
    expect(
      computeUserSecondarySyncSuccessRatesMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(
      aggregateReconfigAndPotentialSyncOpsStub
    ).to.have.been.calledOnceWithExactly(
      USERS,
      UNHEALTHY_PEERS,
      USER_SECONDARY_SYNC_SUCCESS_RATES_MAP,
      CNODE_ENDPOINT_TO_SP_ID_MAP,
      CONTENT_NODE_ENDPOINT
    )
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: USER_ID,
      jobFailed: false
    })
  })

  it('should return without throwing when aggregateReconfigAndPotentialSyncOps throws an error', async function () {
    // Run processStateMonitoringJob with each step succeeding except aggregateReconfigAndPotentialSyncOpsStub
    aggregateReconfigAndPotentialSyncOpsStub = sandbox
      .stub()
      .rejects('test unexpected error')
    const jobResult = await processStateMonitoringJob({})

    // Verify that aggregateReconfigAndPotentialSyncOpsStub fails and steps before it succeed
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(USERS)
    expect(
      buildReplicaSetNodesToUserWalletsMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(
      retrieveClockStatusesForUsersAcrossReplicaSetStub
    ).to.have.been.calledOnceWithExactly(REPLICA_SET_NODES_TO_USER_WALLETS_MAP)
    expect(
      computeUserSecondarySyncSuccessRatesMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(
      aggregateReconfigAndPotentialSyncOpsStub
    ).to.have.been.calledOnceWithExactly(
      USERS,
      UNHEALTHY_PEERS,
      USER_SECONDARY_SYNC_SUCCESS_RATES_MAP,
      CNODE_ENDPOINT_TO_SP_ID_MAP,
      CONTENT_NODE_ENDPOINT
    )
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: USER_ID,
      jobFailed: true
    })
  })

  it('should return without throwing when computeUserSecondarySyncSuccessRatesMap throws an error', async function () {
    // Run processStateMonitoringJob with each step succeeding except computeUserSecondarySyncSuccessRatesMapStub
    computeUserSecondarySyncSuccessRatesMapStub = sandbox
      .stub()
      .rejects('test unexpected error')
    const jobResult = await processStateMonitoringJob({})

    // Verify that computeUserSecondarySyncSuccessRatesMapStub fails and steps before it succeed
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(USERS)
    expect(
      buildReplicaSetNodesToUserWalletsMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(
      retrieveClockStatusesForUsersAcrossReplicaSetStub
    ).to.have.been.calledOnceWithExactly(REPLICA_SET_NODES_TO_USER_WALLETS_MAP)
    expect(
      computeUserSecondarySyncSuccessRatesMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(aggregateReconfigAndPotentialSyncOpsStub).to.not.have.been.called
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: USER_ID,
      jobFailed: true
    })
  })

  it('should return without throwing when retrieveClockStatusesForUsersAcrossReplicaSet throws an error', async function () {
    // Run processStateMonitoringJob with each step succeeding except retrieveClockStatusesForUsersAcrossReplicaSetStub
    retrieveClockStatusesForUsersAcrossReplicaSetStub = sandbox
      .stub()
      .rejects('test unexpected error')
    const jobResult = await processStateMonitoringJob({})

    // Verify that retrieveClockStatusesForUsersAcrossReplicaSetStub fails and other steps succeed
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(USERS)
    expect(
      buildReplicaSetNodesToUserWalletsMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(
      retrieveClockStatusesForUsersAcrossReplicaSetStub
    ).to.have.been.calledOnceWithExactly(REPLICA_SET_NODES_TO_USER_WALLETS_MAP)
    expect(computeUserSecondarySyncSuccessRatesMapStub).to.not.have.been.called
    expect(aggregateReconfigAndPotentialSyncOpsStub).to.not.have.been.called
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: USER_ID,
      jobFailed: true
    })
  })

  it('should return without throwing when buildReplicaSetNodesToUserWalletsMap throws an error', async function () {
    // Run processStateMonitoringJob with each step succeeding except buildReplicaSetNodesToUserWalletsMapStub
    buildReplicaSetNodesToUserWalletsMapStub = sandbox
      .stub()
      .throws('test unexpected error')
    const jobResult = await processStateMonitoringJob({})

    // Verify that buildReplicaSetNodesToUserWalletsMapStub fails and other steps succeed
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(USERS)
    expect(
      buildReplicaSetNodesToUserWalletsMapStub
    ).to.have.been.calledOnceWithExactly(USERS)
    expect(retrieveClockStatusesForUsersAcrossReplicaSetStub).to.not.have.been
      .called
    expect(computeUserSecondarySyncSuccessRatesMapStub).to.not.have.been.called
    expect(aggregateReconfigAndPotentialSyncOpsStub).to.not.have.been.called
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: USER_ID,
      jobFailed: true
    })
  })

  it('should return without throwing when getUnhealthyPeers throws an error', async function () {
    // Run processStateMonitoringJob with each step succeeding except getUnhealthyPeers
    getUnhealthyPeersStub = sandbox.stub().rejects('test unexpected error')
    const jobResult = await processStateMonitoringJob({})

    // Verify that each step was called with the expected params
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.have.been.calledOnceWithExactly(USERS)
    expect(buildReplicaSetNodesToUserWalletsMapStub).to.not.have.been.called
    expect(retrieveClockStatusesForUsersAcrossReplicaSetStub).to.not.have.been
      .called
    expect(computeUserSecondarySyncSuccessRatesMapStub).to.not.have.been.called
    expect(aggregateReconfigAndPotentialSyncOpsStub).to.not.have.been.called
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: USER_ID,
      jobFailed: true
    })
  })

  it('should return without throwing when getNodeUsers throws an error', async function () {
    // Run processStateMonitoringJob with each step succeeding except getNodeUsers
    getNodeUsersStub = sandbox.stub().rejects('test unexpected error')
    const jobResult = await processStateMonitoringJob({})

    // Verify that each step was called with the expected params
    expect(getNodeUsersStub).to.have.been.calledOnceWithExactly(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      LAST_PROCESSED_USER_ID,
      NUM_USERS_TO_PROCESS
    )
    expect(getUnhealthyPeersStub).to.not.have.been.called
    expect(buildReplicaSetNodesToUserWalletsMapStub).to.not.have.been.called
    expect(retrieveClockStatusesForUsersAcrossReplicaSetStub).to.not.have.been
      .called
    expect(computeUserSecondarySyncSuccessRatesMapStub).to.not.have.been.called
    expect(aggregateReconfigAndPotentialSyncOpsStub).to.not.have.been.called
    expect(jobResult).to.deep.equal({
      lastProcessedUserId: LAST_PROCESSED_USER_ID,
      jobFailed: true
    })
  })
})
