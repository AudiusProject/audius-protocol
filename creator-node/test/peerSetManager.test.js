import * as Utils from '../src/utils'
const assert = require('assert')
const proxyquire = require('proxyquire')
const chai = require('chai')
const _ = require('lodash')
const nock = require('nock')
const sinon = require('sinon')
const { CancelToken } = require('axios').default

const PeerSetManager = require('../src/snapbackSM/peerSetManager')

const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

describe('test peerSetManager -- determinePeerHealth', () => {
  let peerSetManager

  let baseVerboseHealthCheckResp

  beforeEach(() => {
    nock.disableNetConnect()
    peerSetManager = new PeerSetManager({
      discoveryProviderEndpoint: 'https://discovery_endpoint.audius.co',
      creatorNodeEndpoint: 'https://content_node_endpoint.audius.co'
    })
    baseVerboseHealthCheckResp = {
      version: '0.3.37',
      service: 'content-node',
      healthy: true,
      git: '',
      selectedDiscoveryProvider: 'http://audius-disc-prov_web-server_1:5000',
      creatorNodeEndpoint: 'http://cn1_creator-node_1:4000',
      spID: 1,
      spOwnerWallet: '0xf7316fe994bb92556dcfd998038618ce1227aeea',
      sRegisteredOnURSM: true,
      country: 'US',
      latitude: '41.2619',
      longitude: '-95.8608',
      databaseConnections: 5,
      databaseSize: 8956927,
      usedTCPMemory: 166,
      receivedBytesPerSec: 756.3444159135626,
      transferredBytesPerSec: 186363.63636363638,
      maxStorageUsedPercent: 95,
      numberOfCPUs: 12,
      latestSyncSuccessTimestamp: '2021-06-08T21:29:34.231Z',
      latestSyncFailTimestamp: '',

      // Fields to consider in this test
      thirtyDayRollingSyncSuccessCount: 50,
      thirtyDayRollingSyncFailCount: 10,
      dailySyncSuccessCount: 5,
      dailySyncFailCount: 0,
      totalMemory: 25219547136,
      usedMemory: 16559153152,
      maxFileDescriptors: 9223372036854776000,
      allocatedFileDescriptors: 15456,
      storagePathSize: 259975987200,
      storagePathUsed: 59253436416
    }
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('should throw error if storage path vars are improper', () => {
    const verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.storagePathSize
    delete verboseHealthCheckResp.storagePathUsed

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail(
        'Should not have considered storage criteria if vars are not present'
      )
    }

    // In bytes
    verboseHealthCheckResp.storagePathSize = 200000000000
    verboseHealthCheckResp.storagePathUsed = 190000000000

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail(
        'Should not have passed without meeting minimum storage requirements'
      )
    } catch (e) {
      assert.ok(e.message.includes('storage'))
    }
  })

  it('should throw error if memory vars are improper', () => {
    const verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.usedMemory
    delete verboseHealthCheckResp.totalMemory

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      // Swallow error
      assert.fail(
        'Should not have considered memory criteria if vars are not present'
      )
    }

    // In bytes
    verboseHealthCheckResp.usedMemory = 6000000001
    verboseHealthCheckResp.totalMemory = 12000000000

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail(
        'Should not have passed without meeting minimum memory requirements'
      )
    } catch (e) {
      assert.ok(e.message.includes('memory'))
    }
  })

  it('should throw error if the file descriptors are improper', () => {
    const verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.allocatedFileDescriptors
    delete verboseHealthCheckResp.maxFileDescriptors

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail(
        'Should not have considered file descriptors if vars are not present'
      )
    }

    verboseHealthCheckResp.allocatedFileDescriptors = 1000
    verboseHealthCheckResp.maxFileDescriptors = 1001

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail(
        'Should not have passed when surpassing file descriptors open threshold'
      )
    } catch (e) {
      assert.ok(e.message.includes('file descriptors'))
    }
  })

  it('should throw error if latest sync history vars are improper', () => {
    const verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.dailySyncSuccessCount
    delete verboseHealthCheckResp.dailySyncFailCount

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail(
        'Should not have considered latest sync history if vars are not present'
      )
    }

    verboseHealthCheckResp.dailySyncSuccessCount = 2
    verboseHealthCheckResp.dailySyncFailCount = 1

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail(
        'Should not have considered latest sync history if mininum count not met'
      )
    }

    verboseHealthCheckResp.dailySyncSuccessCount = 5
    verboseHealthCheckResp.dailySyncFailCount = 55

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail(
        'Should not have passed when fail count percentage is greater than success count'
      )
    } catch (e) {
      assert.ok(e.message.includes('sync data'))
    }
  })

  it('should throw error if rolling sync history vars are improper', () => {
    const verboseHealthCheckResp = {
      ...baseVerboseHealthCheckResp
    }
    delete verboseHealthCheckResp.thirtyDayRollingSyncSuccessCount
    delete verboseHealthCheckResp.thirtyDayRollingSyncFailCount

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail(
        'Should not have considered rolling sync history if vars are not present'
      )
    }

    verboseHealthCheckResp.thirtyDayRollingSyncSuccessCount = 5
    verboseHealthCheckResp.thirtyDayRollingSyncFailCount = 1

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
    } catch (e) {
      assert.fail(
        'Should not have considered rolling sync history if mininum count not met'
      )
    }

    verboseHealthCheckResp.thirtyDayRollingSyncSuccessCount = 1
    verboseHealthCheckResp.thirtyDayRollingSyncFailCount = 5000

    try {
      peerSetManager.determinePeerHealth(verboseHealthCheckResp)
      assert.fail(
        'Should not have passed when fail count percentage is greater than success count'
      )
    } catch (e) {
      assert.ok(e.message.includes('sync data'))
    }
  })

  it('should pass if verbose health check resp is proper', () => {
    try {
      peerSetManager.determinePeerHealth(baseVerboseHealthCheckResp)
    } catch (e) {
      assert.fail(`Should have succeeded: ${e.toString()}`)
    }
  })
})

describe('test peerSetManager -- isPrimaryHealthy', () => {
  let peerSetManager

  const primaryEndpoint = 'http://primary.audius.co'

  beforeEach(() => {
    peerSetManager = new PeerSetManager({
      discoveryProviderEndpoint: 'https://discovery_endpoint.audius.co',
      creatorNodeEndpoint: 'https://content_node_endpoint.audius.co'
    })
  })

  it('should mark primary as healthy if responds with 200 from health check', async () => {
    // Mock method
    peerSetManager.isNodeHealthy = async () => {
      return true
    }

    const isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.strictEqual(
      peerSetManager.primaryToEarliestFailedHealthCheckTimestamp[
        primaryEndpoint
      ],
      undefined
    )
  })

  it('should mark primary as healthy if responds with 500 from health check and has not been visited yet', async () => {
    peerSetManager.isNodeHealthy = async () => {
      return false
    }

    const isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.ok(
      peerSetManager.primaryToEarliestFailedHealthCheckTimestamp[
        primaryEndpoint
      ]
    )
  })

  it('should mark primary as unhealthy if responds with 500 from health check and the primary has surpassed the allowed threshold time to be unhealthy', async () => {
    // Set `maxNumberSecondsPrimaryRemainsUnhealthy` to 0 to mock threshold going over
    peerSetManager = new PeerSetManager({
      discoveryProviderEndpoint: 'https://discovery_endpoint.audius.co',
      creatorNodeEndpoint: 'https://content_node_endpoint.audius.co',
      maxNumberSecondsPrimaryRemainsUnhealthy: 0
    })
    peerSetManager.isNodeHealthy = async () => {
      return false
    }

    let isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.ok(
      peerSetManager.primaryToEarliestFailedHealthCheckTimestamp[
        primaryEndpoint
      ]
    )

    isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, false)
    assert.ok(
      peerSetManager.primaryToEarliestFailedHealthCheckTimestamp[
        primaryEndpoint
      ]
    )
  })

  it('removes primary from map if it goes from unhealthy and back to healthy', async () => {
    peerSetManager.isNodeHealthy = async () => {
      return false
    }

    let isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.ok(
      peerSetManager.primaryToEarliestFailedHealthCheckTimestamp[
        primaryEndpoint
      ]
    )

    //  Mock again
    peerSetManager.isNodeHealthy = async () => {
      return true
    }

    isHealthy = await peerSetManager.isPrimaryHealthy(primaryEndpoint)

    assert.strictEqual(isHealthy, true)
    assert.ok(
      !peerSetManager.primaryToEarliestFailedHealthCheckTimestamp[
        primaryEndpoint
      ]
    )
  })
})

describe('test peerSetManager -- getNodeUsers', () => {
  const DISCOVERY_NODE_ENDPOINT = 'https://discovery_endpoint.audius.co'
  const CREATOR_NODE_ENDPOINT = 'https://content_node_endpoint.audius.co'
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

  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('uses correct params for axios request when not given pagination params', async () => {
    const GET_NODE_USERS_TIMEOUT_MS = 100
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 5_000
    const GET_NODE_USERS_DEFAULT_PAGE_SIZE = 10

    let method, baseURL, url, params, timeout, cancelToken, otherParams
    const axios = async (req) => {
      ;({ method, baseURL, url, params, timeout, cancelToken, ...otherParams } =
        req)

      return { data: { data: users } }
    }
    const cancelTokenSourceMock = sinon.mock(CancelToken.source())
    const cancelTokenCancelFunc = sinon.stub()
    cancelTokenSourceMock.cancel = cancelTokenCancelFunc
    const cancelTokenStub = { source: () => cancelTokenSourceMock }
    axios.CancelToken = cancelTokenStub
    const MockedPeerSetManager = proxyquire(
      '../src/snapbackSM/peerSetManager.js',
      {
        axios: axios,
        './StateMachineConstants': {
          GET_NODE_USERS_TIMEOUT_MS,
          GET_NODE_USERS_CANCEL_TOKEN_MS,
          GET_NODE_USERS_DEFAULT_PAGE_SIZE
        }
      }
    )
    const peerSetManager = new MockedPeerSetManager({
      discoveryProviderEndpoint: DISCOVERY_NODE_ENDPOINT,
      creatorNodeEndpoint: CREATOR_NODE_ENDPOINT
    })

    await peerSetManager.getNodeUsers()

    expect(method).to.equal('get')
    expect(baseURL).to.equal(DISCOVERY_NODE_ENDPOINT)
    expect(url).to.equal('v1/full/users/content_node/all')
    expect(params).to.deep.equal({
      creator_node_endpoint: CREATOR_NODE_ENDPOINT,
      prev_user_id: 0,
      max_users: GET_NODE_USERS_DEFAULT_PAGE_SIZE
    })
    expect(timeout).to.equal(GET_NODE_USERS_TIMEOUT_MS)
    expect(cancelToken).to.equal(cancelTokenSourceMock.token)
    expect(cancelTokenCancelFunc).to.not.have.been.called
    expect(otherParams).to.be.empty
  })

  it('uses correct params for axios request when given pagination params', async () => {
    const GET_NODE_USERS_TIMEOUT_MS = 100
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 5_000
    const GET_NODE_USERS_DEFAULT_PAGE_SIZE = 10

    const prevUserId = 1
    const maxUsers = 25

    let method, baseURL, url, params, timeout, cancelToken, otherParams
    const axios = async (req) => {
      ;({ method, baseURL, url, params, timeout, cancelToken, ...otherParams } =
        req)

      return { data: { data: users } }
    }
    const cancelTokenSourceMock = sinon.mock(CancelToken.source())
    const cancelTokenCancelFunc = sinon.stub()
    cancelTokenSourceMock.cancel = cancelTokenCancelFunc
    const cancelTokenStub = { source: () => cancelTokenSourceMock }
    axios.CancelToken = cancelTokenStub
    const MockedPeerSetManager = proxyquire(
      '../src/snapbackSM/peerSetManager.js',
      {
        axios: axios,
        './StateMachineConstants': {
          GET_NODE_USERS_TIMEOUT_MS,
          GET_NODE_USERS_CANCEL_TOKEN_MS,
          GET_NODE_USERS_DEFAULT_PAGE_SIZE
        }
      }
    )
    const peerSetManager = new MockedPeerSetManager({
      discoveryProviderEndpoint: DISCOVERY_NODE_ENDPOINT,
      creatorNodeEndpoint: CREATOR_NODE_ENDPOINT
    })

    await peerSetManager.getNodeUsers(prevUserId, maxUsers)

    expect(method).to.equal('get')
    expect(baseURL).to.equal(DISCOVERY_NODE_ENDPOINT)
    expect(url).to.equal('v1/full/users/content_node/all')
    expect(params).to.deep.equal({
      creator_node_endpoint: CREATOR_NODE_ENDPOINT,
      prev_user_id: prevUserId,
      max_users: maxUsers
    })
    expect(timeout).to.equal(GET_NODE_USERS_TIMEOUT_MS)
    expect(cancelToken).to.equal(cancelTokenSourceMock.token)
    expect(cancelTokenCancelFunc).to.not.have.been.called
    expect(otherParams).to.be.empty
  })

  it('throws when one or more users is missing a required field', async () => {
    const axios = async (_) => {
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
    const MockedPeerSetManager = proxyquire(
      '../src/snapbackSM/peerSetManager.js',
      {
        axios: axios
      }
    )
    const peerSetManager = new MockedPeerSetManager({
      discoveryProviderEndpoint: DISCOVERY_NODE_ENDPOINT,
      creatorNodeEndpoint: CREATOR_NODE_ENDPOINT
    })

    return expect(peerSetManager.getNodeUsers())
      .to.eventually.be.rejectedWith(
        'getNodeUsers() Error: Unexpected response format during getNodeUsers() call'
      )
      .and.be.an.instanceOf(Error)
  })

  it('uses cancel token to cancel axios request after delay (using stubbed axios)', async () => {
    const GET_NODE_USERS_TIMEOUT_MS = 5_000
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 100
    const GET_NODE_USERS_DEFAULT_PAGE_SIZE = 10

    let timeout, cancelToken
    const axios = async (req) => {
      ;({ timeout, cancelToken } = req)

      // Wait long enough for the cancel token to cancel the axios request
      await Utils.timeout(GET_NODE_USERS_CANCEL_TOKEN_MS + 1)

      return { data: { data: users } }
    }
    const cancelTokenSourceMock = sinon.mock(CancelToken.source())
    const cancelTokenCancelFunc = sinon.stub()
    cancelTokenSourceMock.cancel = cancelTokenCancelFunc
    const cancelTokenStub = { source: () => cancelTokenSourceMock }
    axios.CancelToken = cancelTokenStub
    const MockedPeerSetManager = proxyquire(
      '../src/snapbackSM/peerSetManager.js',
      {
        axios: axios,
        './StateMachineConstants': {
          GET_NODE_USERS_TIMEOUT_MS,
          GET_NODE_USERS_CANCEL_TOKEN_MS,
          GET_NODE_USERS_DEFAULT_PAGE_SIZE
        }
      }
    )
    const peerSetManager = new MockedPeerSetManager({
      discoveryProviderEndpoint: DISCOVERY_NODE_ENDPOINT,
      creatorNodeEndpoint: CREATOR_NODE_ENDPOINT
    })

    await peerSetManager.getNodeUsers()

    expect(timeout).to.equal(GET_NODE_USERS_TIMEOUT_MS)
    expect(cancelToken).to.equal(cancelTokenSourceMock.token)
    expect(cancelTokenCancelFunc).to.have.been.calledOnceWithExactly(
      `getNodeUsers took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out`
    )
  })

  it('uses cancel token to cancel axios request after delay (using real axios with delayConnection)', async () => {
    const GET_NODE_USERS_TIMEOUT_MS = 5_000
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 100
    const GET_NODE_USERS_DEFAULT_PAGE_SIZE = 10

    const MockedPeerSetManager = proxyquire(
      '../src/snapbackSM/peerSetManager.js',
      {
        './StateMachineConstants': {
          GET_NODE_USERS_TIMEOUT_MS,
          GET_NODE_USERS_CANCEL_TOKEN_MS,
          GET_NODE_USERS_DEFAULT_PAGE_SIZE
        }
      }
    )
    const peerSetManager = new MockedPeerSetManager({
      discoveryProviderEndpoint: DISCOVERY_NODE_ENDPOINT,
      creatorNodeEndpoint: CREATOR_NODE_ENDPOINT
    })

    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: CREATOR_NODE_ENDPOINT,
        prev_user_id: 0,
        max_users: GET_NODE_USERS_DEFAULT_PAGE_SIZE
      })
      .delay(GET_NODE_USERS_CANCEL_TOKEN_MS + 1)
      .reply(200, { data: users })

    return expect(peerSetManager.getNodeUsers())
      .to.eventually.be.rejectedWith(
        `getNodeUsers() Error: Cancel: getNodeUsers took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out - connected discprov [${DISCOVERY_NODE_ENDPOINT}]`
      )
      .and.be.an.instanceOf(Error)
  })

  it('uses cancel token to cancel axios request after delay (using real axios with delayBody)', async () => {
    const GET_NODE_USERS_TIMEOUT_MS = 5_000
    const GET_NODE_USERS_CANCEL_TOKEN_MS = 100
    const GET_NODE_USERS_DEFAULT_PAGE_SIZE = 10

    const MockedPeerSetManager = proxyquire(
      '../src/snapbackSM/peerSetManager.js',
      {
        './StateMachineConstants': {
          GET_NODE_USERS_TIMEOUT_MS,
          GET_NODE_USERS_CANCEL_TOKEN_MS,
          GET_NODE_USERS_DEFAULT_PAGE_SIZE
        }
      }
    )
    const peerSetManager = new MockedPeerSetManager({
      discoveryProviderEndpoint: DISCOVERY_NODE_ENDPOINT,
      creatorNodeEndpoint: CREATOR_NODE_ENDPOINT
    })

    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: CREATOR_NODE_ENDPOINT,
        prev_user_id: 0,
        max_users: GET_NODE_USERS_DEFAULT_PAGE_SIZE
      })
      .delayBody(GET_NODE_USERS_CANCEL_TOKEN_MS + 1)
      .reply(200, { data: users })

    return expect(peerSetManager.getNodeUsers())
      .to.eventually.be.rejectedWith(
        `getNodeUsers() Error: Cancel: getNodeUsers took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out - connected discprov [${DISCOVERY_NODE_ENDPOINT}]`
      )
      .and.be.an.instanceOf(Error)
  })
})
