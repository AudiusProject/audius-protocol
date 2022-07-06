/* eslint-disable no-unused-expressions */
const nock = require('nock')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')
const _ = require('lodash')
const { CancelToken } = require('axios').default
const assert = require('assert')

const DBManager = require('../src/dbManager')
const config = require('../src/config')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const Utils = require('../src/utils')
const {
  getLatestUserIdFromDiscovery,
  buildReplicaSetNodesToUserWalletsMap,
  computeUserSecondarySyncSuccessRatesMap,
  computeSyncModeForUserAndReplica
} = require('../src/services/stateMachineManager/stateMonitoring/stateMonitoringUtils')
const {
  SyncType,
  SYNC_MODES
} = require('../src/services/stateMachineManager/stateMachineConstants')
const SecondarySyncHealthTracker = require('../src/snapbackSM/secondarySyncHealthTracker')

describe('test getLatestUserIdFromDiscovery()', function () {
  const DISCOVERY_NODE_ENDPOINT = 'https://discovery_endpoint.audius.co'

  beforeEach(() => {
    nock.disableNetConnect()
  })
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('returns correct value from discovery endpoint param', async function () {
    const latestUserId = 123
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/latest/user')
      .reply(200, { data: latestUserId })

    return expect(
      getLatestUserIdFromDiscovery(DISCOVERY_NODE_ENDPOINT)
    ).to.eventually.be.fulfilled.and.equal(latestUserId)
  })

  it('throws when the axios request fails', async function () {
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/latest/user')
      .times(5) // asyncRetry retries 5 times
      .reply(500)

    return expect(getLatestUserIdFromDiscovery(DISCOVERY_NODE_ENDPOINT))
      .to.eventually.be.rejectedWith(
        `getLatestUserIdFromDiscovery() Error: Error: Request failed with status code 500 - connected discovery node: [${DISCOVERY_NODE_ENDPOINT}]`
      )
      .and.be.an.instanceOf(Error)
  })
})

describe('test getNodeUsers()', function () {
  const DISCOVERY_NODE_ENDPOINT = 'https://discovery_endpoint.audius.co'
  const CONTENT_NODE_ENDPOINT = 'https://content_node_endpoint.audius.co'
  const DEFAULT_GET_NODE_USERS_TIMEOUT_MS = 100
  const DEFAULT_GET_NODE_USERS_CANCEL_TOKEN_MS = 5_000
  const DEFAULT_GET_NODE_USERS_DEFAULT_PAGE_SIZE = 10

  const users = []
  _.range(1, 20).forEach((userId) => {
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

  function mockGetNodeUsers({
    axios,
    GET_NODE_USERS_TIMEOUT_MS = DEFAULT_GET_NODE_USERS_TIMEOUT_MS,
    GET_NODE_USERS_CANCEL_TOKEN_MS = DEFAULT_GET_NODE_USERS_CANCEL_TOKEN_MS
  }) {
    const { getNodeUsers } = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/stateMonitoringUtils.js',
      {
        axios,
        '../stateMachineConstants': {
          GET_NODE_USERS_TIMEOUT_MS,
          GET_NODE_USERS_CANCEL_TOKEN_MS,
          GET_NODE_USERS_DEFAULT_PAGE_SIZE:
            DEFAULT_GET_NODE_USERS_DEFAULT_PAGE_SIZE
        }
      }
    )
    return getNodeUsers
  }

  let sandbox
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    nock.disableNetConnect()
  })

  afterEach(() => {
    sandbox.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('uses correct params for axios request when not given pagination params', async function () {
    let method, baseURL, url, params, timeout, cancelToken, otherParams
    const axiosStub = async (req) => {
      ;({ method, baseURL, url, params, timeout, cancelToken, ...otherParams } =
        req)

      return { data: { data: users } }
    }
    const cancelTokenSourceMock = sandbox.mock(CancelToken.source())
    const cancelTokenCancelFunc = sandbox.stub()
    cancelTokenSourceMock.cancel = cancelTokenCancelFunc
    const cancelTokenStub = { source: () => cancelTokenSourceMock }
    axiosStub.CancelToken = cancelTokenStub

    const getNodeUsers = mockGetNodeUsers({ axios: axiosStub })
    await getNodeUsers(DISCOVERY_NODE_ENDPOINT, CONTENT_NODE_ENDPOINT)

    expect(method).to.equal('get')
    expect(baseURL).to.equal(DISCOVERY_NODE_ENDPOINT)
    expect(url).to.equal('v1/full/users/content_node/all')
    expect(params).to.deep.equal({
      creator_node_endpoint: CONTENT_NODE_ENDPOINT,
      prev_user_id: 0,
      max_users: DEFAULT_GET_NODE_USERS_DEFAULT_PAGE_SIZE
    })
    expect(timeout).to.equal(DEFAULT_GET_NODE_USERS_TIMEOUT_MS)
    expect(cancelToken).to.equal(cancelTokenSourceMock.token)
    expect(cancelTokenCancelFunc).to.not.have.been.called
    expect(otherParams).to.be.empty
  })

  it('uses correct params for axios request when given pagination params', async function () {
    const prevUserId = 1
    const maxUsers = 25

    let method, baseURL, url, params, timeout, cancelToken, otherParams
    const axiosStub = async (req) => {
      ;({ method, baseURL, url, params, timeout, cancelToken, ...otherParams } =
        req)

      return { data: { data: users } }
    }
    const cancelTokenSourceMock = sandbox.mock(CancelToken.source())
    const cancelTokenCancelFunc = sandbox.stub()
    cancelTokenSourceMock.cancel = cancelTokenCancelFunc
    const cancelTokenStub = { source: () => cancelTokenSourceMock }
    axiosStub.CancelToken = cancelTokenStub

    const getNodeUsers = mockGetNodeUsers({ axios: axiosStub })
    await getNodeUsers(
      DISCOVERY_NODE_ENDPOINT,
      CONTENT_NODE_ENDPOINT,
      prevUserId,
      maxUsers
    )

    expect(method).to.equal('get')
    expect(baseURL).to.equal(DISCOVERY_NODE_ENDPOINT)
    expect(url).to.equal('v1/full/users/content_node/all')
    expect(params).to.deep.equal({
      creator_node_endpoint: CONTENT_NODE_ENDPOINT,
      prev_user_id: prevUserId,
      max_users: maxUsers
    })
    expect(timeout).to.equal(DEFAULT_GET_NODE_USERS_TIMEOUT_MS)
    expect(cancelToken).to.equal(cancelTokenSourceMock.token)
    expect(cancelTokenCancelFunc).to.not.have.been.called
    expect(otherParams).to.be.empty
  })

  it('throws when one or more users is missing a required field', async function () {
    const axiosStub = async (_) => {
      return {
        data: {
          data: [
            ...users,
            {
              user_id: 'userId with missing secondary2SpID',
              wallet: `wallet`,
              primary: 'http://cn1.co',
              secondary1: 'http://cn2.co',
              secondary2: 'http://cn3.co',
              primarySpID: 1,
              secondary1SpID: 2
            }
          ]
        }
      }
    }
    const getNodeUsers = mockGetNodeUsers({ axios: axiosStub })

    return expect(getNodeUsers(DISCOVERY_NODE_ENDPOINT, CONTENT_NODE_ENDPOINT))
      .to.eventually.be.rejectedWith(
        'getNodeUsers() Error: Unexpected response format during getNodeUsers() call'
      )
      .and.be.an.instanceOf(Error)
  })

  it('uses cancel token to cancel axios request after delay (using stubbed axios)', async function () {
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 50

    let timeout, cancelToken
    const axiosStub = async (req) => {
      ;({ timeout, cancelToken } = req)

      // Wait long enough for the cancel token to cancel the axios request
      await Utils.timeout(GET_NODE_USERS_CANCEL_TOKEN_MS + 1)

      return { data: { data: users } }
    }
    const cancelTokenSourceMock = sandbox.mock(CancelToken.source())
    const cancelTokenCancelFunc = sandbox.stub()
    cancelTokenSourceMock.cancel = cancelTokenCancelFunc
    const cancelTokenStub = { source: () => cancelTokenSourceMock }
    axiosStub.CancelToken = cancelTokenStub
    const getNodeUsers = mockGetNodeUsers({
      axios: axiosStub,
      GET_NODE_USERS_CANCEL_TOKEN_MS
    })

    await getNodeUsers(DISCOVERY_NODE_ENDPOINT, CONTENT_NODE_ENDPOINT)

    expect(timeout).to.equal(DEFAULT_GET_NODE_USERS_TIMEOUT_MS)
    expect(cancelToken).to.equal(cancelTokenSourceMock.token)
    expect(cancelTokenCancelFunc).to.have.been.calledOnceWithExactly(
      `getNodeUsers() took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out`
    )
  })

  it('uses cancel token to cancel axios request after delay (using real axios with delayConnection)', async function () {
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 50

    const realAxios = require('axios')
    const getNodeUsers = mockGetNodeUsers({
      axios: realAxios,
      GET_NODE_USERS_CANCEL_TOKEN_MS
    })

    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: CONTENT_NODE_ENDPOINT,
        prev_user_id: 0,
        max_users: DEFAULT_GET_NODE_USERS_DEFAULT_PAGE_SIZE
      })
      .delay(GET_NODE_USERS_CANCEL_TOKEN_MS + 1)
      .times(5) // asyncRetry retries 5 times
      .reply(200, { data: users })

    return expect(getNodeUsers(DISCOVERY_NODE_ENDPOINT, CONTENT_NODE_ENDPOINT))
      .to.eventually.be.rejectedWith(
        `getNodeUsers() Error: Cancel: getNodeUsers() took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out - connected discovery node [${DISCOVERY_NODE_ENDPOINT}]`
      )
      .and.be.an.instanceOf(Error)
  })

  it('uses cancel token to cancel axios request after delay (using real axios with delayBody)', async function () {
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 50

    const realAxios = require('axios')
    const getNodeUsers = mockGetNodeUsers({
      axios: realAxios,
      GET_NODE_USERS_CANCEL_TOKEN_MS
    })

    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: CONTENT_NODE_ENDPOINT,
        prev_user_id: 0,
        max_users: DEFAULT_GET_NODE_USERS_DEFAULT_PAGE_SIZE
      })
      .delayBody(GET_NODE_USERS_CANCEL_TOKEN_MS + 1)
      .times(5) // asyncRetry retries 5 times
      .reply(200, { data: users })

    return expect(getNodeUsers(DISCOVERY_NODE_ENDPOINT, CONTENT_NODE_ENDPOINT))
      .to.eventually.be.rejectedWith(
        `getNodeUsers() Error: Cancel: getNodeUsers() took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out - connected discovery node [${DISCOVERY_NODE_ENDPOINT}]`
      )
      .and.be.an.instanceOf(Error)
  })
})

describe('test buildReplicaSetNodesToUserWalletsMap()', function () {
  it('', function () {
    const nodeUsersInput = [
      {
        user_id: '1',
        wallet: 'wallet1',
        primary: 'http://cn1.audius.co',
        secondary1: 'http://cn2.audius.co',
        secondary2: 'http://cn3.audius.co'
      },
      {
        user_id: '2',
        wallet: 'wallet2',
        primary: 'http://cn2.audius.co',
        secondary1: 'http://cn3.audius.co',
        secondary2: 'http://cn4.audius.co'
      },
      {
        user_id: '3',
        wallet: 'wallet3',
        primary: 'http://cn3.audius.co',
        secondary1: 'http://cn4.audius.co',
        secondary2: 'http://cn5.audius.co'
      },
      {
        user_id: '4',
        wallet: 'wallet4',
        primary: 'http://cn3.audius.co',
        secondary1: 'http://cn2.audius.co',
        secondary2: 'http://cn1.audius.co'
      }
    ]
    const expectedReplicaSetNodesToUserWalletsMapOutput = {
      'http://cn1.audius.co': ['wallet1', 'wallet4'],
      'http://cn2.audius.co': ['wallet1', 'wallet2', 'wallet4'],
      'http://cn3.audius.co': ['wallet1', 'wallet2', 'wallet3', 'wallet4'],
      'http://cn4.audius.co': ['wallet2', 'wallet3'],
      'http://cn5.audius.co': ['wallet3']
    }
    expect(buildReplicaSetNodesToUserWalletsMap(nodeUsersInput)).to.deep.equal(
      expectedReplicaSetNodesToUserWalletsMapOutput
    )
  })
})

describe('test computeUserSecondarySyncSuccessRatesMap()', function () {
  let server
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app
    await app.get('redisClient').flushdb()
  })

  afterEach(async function () {
    await server.close()
  })

  it('returns expected counts and percentages after recording successes and failures', async function () {
    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnWithSpId3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      },
      {
        user_id: 2,
        wallet: 'wallet2',
        primary: 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnWithSpId3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]

    await SecondarySyncHealthTracker.recordSuccess(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordSuccess(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordSuccess(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordFailure(
      [nodeUsers[0].secondary1],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )
    await SecondarySyncHealthTracker.recordFailure(
      [nodeUsers[0].secondary2],
      [nodeUsers[0].wallet],
      SyncType.Recurring
    )

    const expectedUserSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        [nodeUsers[0].secondary1]: {
          successRate: 0.75,
          successCount: 3,
          failureCount: 1
        },
        [nodeUsers[0].secondary2]: {
          successRate: 0,
          successCount: 0,
          failureCount: 1
        }
      },
      [nodeUsers[1].wallet]: {
        [nodeUsers[1].secondary1]: {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        [nodeUsers[1].secondary2]: {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }

    const userSecondarySyncMetricsMap =
      await computeUserSecondarySyncSuccessRatesMap(nodeUsers)

    expect(userSecondarySyncMetricsMap).to.deep.equal(
      expectedUserSecondarySyncMetricsMap
    )
  })
})

describe('test aggregateReconfigAndPotentialSyncOps()', function () {
  let server

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    server = appInfo.server
    const app = appInfo.app
    await app.get('redisClient').flushdb()
    config.set('spID', 1)
  })

  afterEach(async function () {
    await server.close()
  })

  function getAggregateReconfigAndPotentialSyncOps(config) {
    const { aggregateReconfigAndPotentialSyncOps } = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/stateMonitoringUtils.js',
      {
        '../../../config': config
      }
    )
    return aggregateReconfigAndPotentialSyncOps
  }

  it('if the self node is the secondary and a primary spId is different from what is on chain, issue reconfig', async function () {
    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    const endpointToSPIdMap = {
      'http://cnOriginallySpId3ReregisteredAsSpId4.co': 4,
      'http://cnWithSpId2.co': 2,
      'http://cnWithSpId3.co': 3
    }
    const thisContentNodeEndpoint = 'http://cnWithSpId2.co'

    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnWithSpId3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]
    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnWithSpId3.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.keys(['http://cnOriginallySpId3ReregisteredAsSpId4.co'])
    expect(potentialSyncRequests).to.have.lengthOf(0)
  })

  it('if the self node is the primary and a secondary spId is different from what is on chain, issue reconfig', async function () {
    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    const endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://cnOriginallySpId3ReregisteredAsSpId4.co': 4
    }

    const thisContentNodeEndpoint = 'http://some_healthy_primary.co'
    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://some_healthy_primary.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]
    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnOriginallySpId3ReregisteredAsSpId4.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.keys(['http://cnOriginallySpId3ReregisteredAsSpId4.co'])
    expect(potentialSyncRequests)
      .to.have.nested.property('[0]')
      .that.has.property('endpoint')
      .that.equals('http://cnWithSpId2.co')
  })

  it('if the self node (primary) is the same as the SP with a different spId, do not issue reconfig', async function () {
    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    const endpointToSPIdMap = {
      'http://some_healthy_primary.co': 4,
      'http://cnWithSpId2.co': 2,
      'http://cnWithSpId3.co': 3
    }

    const thisContentNodeEndpoint = 'http://some_healthy_primary.co'
    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://some_healthy_primary.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnWithSpId3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]
    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnWithSpId3.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    // Make sure that the CN with the different spId gets put into `requiredUpdateReplicaSetOps`
    expect(requiredUpdateReplicaSetOps).to.have.lengthOf(0)
    expect(potentialSyncRequests).to.have.lengthOf(2)
    expect(potentialSyncRequests)
      .to.have.nested.property('[0]')
      .that.has.property('endpoint')
      .that.equals('http://cnWithSpId2.co')
    expect(potentialSyncRequests)
      .to.have.nested.property('[1]')
      .that.has.property('endpoint')
      .that.equals('http://cnWithSpId3.co')
  })

  it('if the self node (secondary) is the same as the SP with a different spId, do not issue reconfig', async function () {
    // Mock that one of the nodes got reregistered from spId 3 to spId 4
    const endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://cnOriginallySpId3ReregisteredAsSpId4.co': 4
    }

    const thisContentNodeEndpoint =
      'http://cnOriginallySpId3ReregisteredAsSpId4.co'
    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://some_healthy_primary.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnOriginallySpId3ReregisteredAsSpId4.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]
    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://cnOriginallySpId3ReregisteredAsSpId4.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    expect(requiredUpdateReplicaSetOps).to.have.lengthOf(0)
    expect(potentialSyncRequests).to.have.lengthOf(0)
  })

  it('if any replica set node is not in the map, issue reconfig', async function () {
    // Mock the deregistered node to not have any spId
    const endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2
    }

    const thisContentNodeEndpoint = 'http://some_healthy_primary.co'
    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://some_healthy_primary.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://deregisteredCN.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]
    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://deregisteredCN.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.keys(['http://deregisteredCN.co'])
    expect(potentialSyncRequests)
      .to.have.nested.property('[0]')
      .that.has.property('endpoint')
      .that.equals('http://cnWithSpId2.co')
  })

  it('if the self node (primary) and 1 secondary are healthy but not the other secondary, issue reconfig for the unhealthy secondary', async function () {
    const endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://unhealthyCnWithSpId3.co': 3
    }

    const thisContentNodeEndpoint = 'http://some_healthy_primary.co'
    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://some_healthy_primary.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://unhealthyCnWithSpId3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]
    const unhealthyPeers = new Set(['http://unhealthyCnWithSpId3.co'])
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        },
        'http://unhealthyCnWithSpId3.co': {
          successRate: 1,
          successCount: 0,
          failureCount: 0
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    // Make sure that the unhealthy secondary put into `requiredUpdateReplicaSetOps`
    expect(requiredUpdateReplicaSetOps).to.have.lengthOf(1)
    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.property('size', 1)
    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.keys(['http://unhealthyCnWithSpId3.co'])
    expect(potentialSyncRequests).to.have.lengthOf(1)
    expect(potentialSyncRequests)
      .to.have.nested.property('[0]')
      .that.has.property('endpoint')
      .that.equals('http://cnWithSpId2.co')
  })

  it('if the self node (primary) and and secondaries are healthy but sync success rate is low, issue reconfig', async function () {
    config.set('minimumFailedSyncRequestsBeforeReconfig', 5)
    config.set('minimumSecondaryUserSyncSuccessPercent', 25)
    const endpointToSPIdMap = {
      'http://some_healthy_primary.co': 1,
      'http://cnWithSpId2.co': 2,
      'http://cnWithSpId3.co': 3
    }

    const thisContentNodeEndpoint = 'http://some_healthy_primary.co'

    const nodeUsers = [
      {
        user_id: 1,
        wallet: '0x00fc5bff87afb1f15a02e82c3f671cf5c9ad9e6d',
        primary: 'http://some_healthy_primary.co',
        secondary1: 'http://cnWithSpId2.co',
        secondary2: 'http://cnWithSpId3.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    ]

    const unhealthyPeers = new Set()
    const userSecondarySyncMetricsMap = {
      [nodeUsers[0].wallet]: {
        'http://cnWithSpId2.co': {
          successRate: 1,
          successCount: 1,
          failureCount: 0
        },
        'http://cnWithSpId3.co': {
          successRate: 0.1,
          successCount: 1,
          failureCount: 9
        }
      }
    }
    const aggregateReconfigAndPotentialSyncOps =
      getAggregateReconfigAndPotentialSyncOps(config)
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        endpointToSPIdMap,
        thisContentNodeEndpoint
      )

    // Make sure that the CN with low sync success put into `requiredUpdateReplicaSetOps`
    expect(requiredUpdateReplicaSetOps).to.have.lengthOf(1)
    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.property('size', 1)
    expect(requiredUpdateReplicaSetOps)
      .to.have.nested.property('[0]')
      .that.has.property('unhealthyReplicas')
      .that.has.keys(['http://cnWithSpId3.co'])
    expect(potentialSyncRequests).to.have.lengthOf(1)
    expect(potentialSyncRequests)
      .to.have.nested.property('[0]')
      .that.has.property('endpoint')
      .that.equals('http://cnWithSpId2.co')
  })
})

describe('Test computeSyncModeForUserAndReplica()', function () {
  let primaryClock,
    secondaryClock,
    primaryFilesHash,
    secondaryFilesHash,
    primaryFilesHashMock

  // Can be anything for test purposes
  const wallet = 'wallet'

  it('Throws if missing or invalid params', async function () {
    primaryClock = 10
    secondaryClock = 10
    primaryFilesHash = undefined
    secondaryFilesHash = undefined

    try {
      await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })
    } catch (e) {
      assert.strictEqual(
        e.message,
        '[computeSyncModeForUserAndReplica()] Error: Missing or invalid params'
      )
    }
  })

  it('Returns SYNC_MODES.None if clocks and filesHashes equal', async function () {
    primaryClock = 10
    secondaryClock = primaryClock
    primaryFilesHash = '0x123'
    secondaryFilesHash = primaryFilesHash

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SYNC_MODES.None)
  })

  it('Returns SYNC_MODES.MergePrimaryAndSecondary if clocks equal and filesHashes unequal', async function () {
    primaryClock = 10
    secondaryClock = primaryClock
    primaryFilesHash = '0x123'
    secondaryFilesHash = '0x456'

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SYNC_MODES.MergePrimaryAndSecondary)
  })

  it('Returns SYNC_MODES.MergePrimaryAndSecondary if primaryClock < secondaryClock', async function () {
    primaryClock = 5
    secondaryClock = 10
    primaryFilesHash = '0x123'
    secondaryFilesHash = '0x456'

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SYNC_MODES.MergePrimaryAndSecondary)
  })

  it('Returns SYNC_MODES.SyncSecondaryFromPrimary if primaryClock > secondaryClock & secondaryFilesHash === null', async function () {
    primaryClock = 10
    secondaryClock = 5
    primaryFilesHash = '0x123'
    secondaryFilesHash = null

    const syncMode = await computeSyncModeForUserAndReplica({
      wallet,
      primaryClock,
      secondaryClock,
      primaryFilesHash,
      secondaryFilesHash
    })

    assert.strictEqual(syncMode, SYNC_MODES.SyncSecondaryFromPrimary)
  })

  describe('primaryClock > secondaryClock', function () {
    it('Returns SYNC_MODES.SyncSecondaryFromPrimary if primaryFilesHashForRange = secondaryFilesHash', async function () {
      primaryClock = 10
      secondaryClock = 5
      primaryFilesHash = '0x123'
      secondaryFilesHash = '0x456'

      // Mock DBManager.fetchFilesHashFromDB() to return `secondaryFilesHash` for clock range
      const DBManagerMock = DBManager
      DBManagerMock.fetchFilesHashFromDB = async () => {
        return secondaryFilesHash
      }
      proxyquire('../src/services/stateMachineManager/stateMonitoring/stateMonitoringUtils', {
        '../../../dbManager': DBManagerMock
      })

      const syncMode = await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })

      assert.strictEqual(syncMode, SYNC_MODES.SyncSecondaryFromPrimary)
    })

    it('Returns SYNC_MODES.MergePrimaryAndSecondary if primaryFilesHashForRange != secondaryFilesHash', async function () {
      primaryClock = 10
      secondaryClock = 5
      primaryFilesHash = '0x123'
      secondaryFilesHash = '0x456'
      primaryFilesHashMock = '0x789'

      // Mock DBManager.fetchFilesHashFromDB() to return different filesHash for clock range
      const DBManagerMock = DBManager
      DBManagerMock.fetchFilesHashFromDB = async () => {
        return primaryFilesHashMock
      }
      proxyquire('../src/services/stateMachineManager/stateMonitoring/stateMonitoringUtils', {
        '../../../dbManager': DBManagerMock
      })

      const syncMode = await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })

      assert.strictEqual(syncMode, SYNC_MODES.MergePrimaryAndSecondary)
    })

    it("Throws error primaryFilesHashForRange can't be retrieved", async function () {
      // Increase mocha test timeout from default 2s to accommodate `async-retry` runtime
      this.timeout(30000) // 30s

      primaryClock = 10
      secondaryClock = 5
      primaryFilesHash = '0x123'
      secondaryFilesHash = '0x456'

      // Mock DBManager.fetchFilesHashFromDB() to throw error
      const errorMsg = 'Mock - Failed to fetch filesHash'
      const DBManagerMock = require('../src/dbManager')
      DBManagerMock.fetchFilesHashFromDB = async () => {
        throw new Error(errorMsg)
      }
      proxyquire('../src/services/stateMachineManager/stateMonitoring/stateMonitoringUtils', {
        '../../../dbManager': DBManagerMock
      })

      try {
        await computeSyncModeForUserAndReplica({
          wallet,
          primaryClock,
          secondaryClock,
          primaryFilesHash,
          secondaryFilesHash
        })
      } catch (e) {
        assert.strictEqual(
          e.message,
          `[computeSyncModeForUserAndReplica()] [DBManager.fetchFilesHashFromDB()] Error - ${errorMsg}`
        )
      }
    })
  })
})
