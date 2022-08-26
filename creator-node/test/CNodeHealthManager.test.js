/* eslint-disable no-unused-expressions */
const nock = require('nock')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')

const CNodeHealthManager = require('../src/services/stateMachineManager/CNodeHealthManager')
const config = require('../src/config')
const Utils = require('../src/utils')

describe('test CNodeHealthManager -- getUnhealthyPeers()', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  const healthyCn1 = 'http://healthy_cn1.co'
  const healthyCn2 = 'http://healthy_cn2.co'
  const unhealthyCn3 = 'http://unhealthy_cn3.co'
  const unhealthyCn4 = 'http://unhealthy_cn4.co'
  const healthyNodes = [healthyCn1, healthyCn2]
  const unhealthyNodes = [unhealthyCn3, unhealthyCn4]
  const users = [
    {
      user_id: 1,
      wallet: 'wallet1',
      primary: healthyCn1,
      secondary1: unhealthyCn3,
      secondary2: unhealthyCn3
    },
    {
      user_id: 2,
      wallet: 'wallet2',
      primary: unhealthyCn4,
      secondary1: healthyCn2,
      secondary2: healthyCn1
    }
  ]
  const thisContentNodeEndpoint = 'http://healthy_cn1.co'

  it('returns all unhealthy nodes with default performSimpleCheck', async function () {
    // Stub functions that getUnhealthyPeers() will call
    sandbox
      .stub(CNodeHealthManager, '_computeContentNodePeerSet')
      .returns(new Set([...healthyNodes, ...unhealthyNodes]))
    const isNodeHealthyStub = sandbox.stub(CNodeHealthManager, 'isNodeHealthy')
    isNodeHealthyStub.withArgs(sinon.match.in(healthyNodes)).resolves(true)
    isNodeHealthyStub.withArgs(sinon.match.in(unhealthyNodes)).resolves(false)

    // Verify that the correct unhealthy peers are returned
    return expect(
      CNodeHealthManager.getUnhealthyPeers(users, thisContentNodeEndpoint)
    ).to.eventually.be.fulfilled.and.deep.equal(new Set(unhealthyNodes))
  })

  it('returns all unhealthy nodes when performSimpleCheck=true', async function () {
    // Stub functions that getUnhealthyPeers() will call
    sandbox
      .stub(CNodeHealthManager, '_computeContentNodePeerSet')
      .returns(new Set([...healthyNodes, ...unhealthyNodes]))
    const isNodeHealthyStub = sandbox.stub(CNodeHealthManager, 'isNodeHealthy')
    isNodeHealthyStub.withArgs(sinon.match.in(healthyNodes)).resolves(true)
    isNodeHealthyStub.withArgs(sinon.match.in(unhealthyNodes)).resolves(false)

    // Verify that the correct unhealthy peers are returned
    return expect(
      CNodeHealthManager.getUnhealthyPeers(users, thisContentNodeEndpoint, true)
    ).to.eventually.be.fulfilled.and.deep.equal(new Set(unhealthyNodes))
  })

  it('returns all unhealthy nodes when performSimpleCheck=false', async function () {
    // Stub functions that getUnhealthyPeers() will call
    sandbox
      .stub(CNodeHealthManager, '_computeContentNodePeerSet')
      .returns(new Set([...healthyNodes, ...unhealthyNodes]))
    const isNodeHealthyStub = sandbox.stub(CNodeHealthManager, 'isNodeHealthy')
    isNodeHealthyStub.withArgs(sinon.match.in(healthyNodes)).resolves(true)
    isNodeHealthyStub.withArgs(sinon.match.in(unhealthyNodes)).resolves(false)

    // Verify that the correct unhealthy peers are returned
    return expect(
      CNodeHealthManager.getUnhealthyPeers(
        users,
        thisContentNodeEndpoint,
        false
      )
    ).to.eventually.be.fulfilled.and.deep.equal(new Set(unhealthyNodes))
  })
})

describe('test CNodeHealthManager -- isNodeHealthy()', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('returns true when health check passes with performSimpleCheck=true', async function () {
    // Stub functions that isNodeHealthy() will call
    const node = 'http://some_content_node.co'
    const verboseHealthCheckResp = { healthy: true }
    const queryVerboseHealthCheckStub = sandbox
      .stub(CNodeHealthManager, 'queryVerboseHealthCheck')
      .resolves(verboseHealthCheckResp)
    const determinePeerHealthStub = sandbox.stub(
      CNodeHealthManager,
      'determinePeerHealth'
    )
    const logErrorStub = sandbox.stub(CNodeHealthManager, 'logError')

    // Verify that only the simple check was performed and returned healthy
    const isHealthy = await CNodeHealthManager.isNodeHealthy(node, true)
    expect(isHealthy).to.be.true
    expect(queryVerboseHealthCheckStub).to.have.been.calledOnceWithExactly(node)
    expect(determinePeerHealthStub).to.not.have.been.called
    expect(logErrorStub).to.not.have.been.called
  })

  it('returns false when health check fails with performSimpleCheck=true', async function () {
    // Stub functions that isNodeHealthy() will call
    const node = 'http://some_content_node.co'
    const error = new Error('test error')
    const queryVerboseHealthCheckStub = sandbox
      .stub(CNodeHealthManager, 'queryVerboseHealthCheck')
      .rejects(error)
    const determinePeerHealthStub = sandbox.stub(
      CNodeHealthManager,
      'determinePeerHealth'
    )
    const logErrorStub = sandbox.stub(CNodeHealthManager, 'logError')

    // Verify that determinePeerHealth is not called because the health
    // check throwing an error causes the function to return false
    const isHealthy = await CNodeHealthManager.isNodeHealthy(node, true)
    expect(isHealthy).to.be.false
    expect(queryVerboseHealthCheckStub).to.have.been.calledOnceWithExactly(node)
    expect(determinePeerHealthStub).to.not.have.been.called
    expect(logErrorStub).to.have.been.called.calledOnceWithExactly(
      `isNodeHealthy() peer=${node} is unhealthy: ${error.toString()}`
    )
  })

  it('returns false when health check fails with performSimpleCheck=false', async function () {
    // Stub functions that isNodeHealthy() will call
    const node = 'http://some_content_node.co'
    const error = new Error('test error')
    const queryVerboseHealthCheckStub = sandbox
      .stub(CNodeHealthManager, 'queryVerboseHealthCheck')
      .rejects(error)
    const determinePeerHealthStub = sandbox.stub(
      CNodeHealthManager,
      'determinePeerHealth'
    )
    const logErrorStub = sandbox.stub(CNodeHealthManager, 'logError')

    // Verify that determinePeerHealth is not called because the health
    // check throwing an error causes the function to return false
    const isHealthy = await CNodeHealthManager.isNodeHealthy(node, false)
    expect(isHealthy).to.be.false
    expect(queryVerboseHealthCheckStub).to.have.been.calledOnceWithExactly(node)
    expect(determinePeerHealthStub).to.not.have.been.called
    expect(logErrorStub).to.have.been.called.calledOnceWithExactly(
      `isNodeHealthy() peer=${node} is unhealthy: ${error.toString()}`
    )
  })

  it('returns false when determinePeerHealth throws with performSimpleCheck=false', async function () {
    // Stub functions that isNodeHealthy() will call
    const node = 'http://some_content_node.co'
    const isNodeHealthyError = new Error('Node health check returned healthy: false')
    const determinePeerHealthError = new Error('test determinePeerHealthError')
    const verboseHealthCheckResp = { healthy: false }
    const queryVerboseHealthCheckStub = sandbox
      .stub(CNodeHealthManager, 'queryVerboseHealthCheck')
      .resolves(verboseHealthCheckResp)
    const determinePeerHealthStub = sandbox
      .stub(CNodeHealthManager, 'determinePeerHealth')
      .throws(determinePeerHealthError)
    const logErrorStub = sandbox.stub(CNodeHealthManager, 'logError')

    // Verify that determinePeerHealth throwing causes the function to return false
    const isHealthy = await CNodeHealthManager.isNodeHealthy(node, false)
    expect(isHealthy).to.be.false
    expect(queryVerboseHealthCheckStub).to.have.been.calledOnceWithExactly(node)
    expect(determinePeerHealthStub).to.not.have.been.called.called
    expect(logErrorStub).to.have.been.called.calledOnceWithExactly(
      `isNodeHealthy() peer=${node} is unhealthy: ${isNodeHealthyError.toString()}`
    )
  })

  it("returns true when determinePeerHealth doesn't throw with performSimpleCheck=false", async function () {
    // Stub functions that isNodeHealthy() will call
    const node = 'http://some_content_node.co'
    const verboseHealthCheckResp = { healthy: true }
    const queryVerboseHealthCheckStub = sandbox
      .stub(CNodeHealthManager, 'queryVerboseHealthCheck')
      .resolves(verboseHealthCheckResp)
    const determinePeerHealthStub = sandbox.stub(
      CNodeHealthManager,
      'determinePeerHealth'
    )
    const logErrorStub = sandbox.stub(CNodeHealthManager, 'logError')

    // Verify that only the simple check was performed and returned healthy
    const isHealthy = await CNodeHealthManager.isNodeHealthy(node, false)
    expect(isHealthy).to.be.true
    expect(queryVerboseHealthCheckStub).to.have.been.calledOnceWithExactly(node)
    expect(determinePeerHealthStub).to.have.been.calledOnceWithExactly(
      verboseHealthCheckResp
    )
    expect(logErrorStub).to.not.have.been.called.called
  })

  it("returns true when determinePeerHealth doesn't throw with default performSimpleCheck", async function () {
    // Stub functions that isNodeHealthy() will call
    const node = 'http://some_content_node.co'
    const verboseHealthCheckResp = { healthy: true }
    const queryVerboseHealthCheckStub = sandbox
      .stub(CNodeHealthManager, 'queryVerboseHealthCheck')
      .resolves(verboseHealthCheckResp)
    const determinePeerHealthStub = sandbox.stub(
      CNodeHealthManager,
      'determinePeerHealth'
    )
    const logErrorStub = sandbox.stub(CNodeHealthManager, 'logError')

    // Verify that only the simple check was performed and returned healthy
    const isHealthy = await CNodeHealthManager.isNodeHealthy(node)
    expect(isHealthy).to.be.true
    expect(queryVerboseHealthCheckStub).to.have.been.calledOnceWithExactly(node)
    expect(determinePeerHealthStub).to.have.been.calledOnceWithExactly(
      verboseHealthCheckResp
    )
    expect(logErrorStub).to.not.have.been.called.called
  })
})

describe('test CNodeHealthManager -- queryVerboseHealthCheck()', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
    nock.disableNetConnect()
  })

  afterEach(function () {
    sandbox.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('returns successful response', async function () {
    const endpoint = 'http://healthy_cn.co'
    const verboseHealthResp = {
      healthy: 'true',
      verboseData: 'data'
    }
    nock(endpoint)
      .get('/health_check/verbose')
      .reply(200, { data: verboseHealthResp })

    await CNodeHealthManager.queryVerboseHealthCheck(endpoint)
    expect(nock.isDone()).to.be.true
  })
})

describe('test CNodeHealthManager -- determinePeerHealth()', function () {
  // Set config vars for health thresholds
  const minimumMemoryAvailable = 100
  const maxFileDescriptorsAllocatedPercentage = 50
  const minimumDailySyncCount = 3
  const minimumRollingSyncCount = 5
  const minimumSuccessfulSyncCountPercentage = 50
  config.set('minimumMemoryAvailable', minimumMemoryAvailable)
  config.set(
    'maxFileDescriptorsAllocatedPercentage',
    maxFileDescriptorsAllocatedPercentage
  )
  config.set('minimumDailySyncCount', minimumDailySyncCount)
  config.set('minimumRollingSyncCount', minimumRollingSyncCount)
  config.set(
    'minimumSuccessfulSyncCountPercentage',
    minimumSuccessfulSyncCountPercentage
  )
  config.set('maxStorageUsedPercent', 95)

  function determinePeerHealth(verboseHealthCheckResp) {
    const CNodeHealthManagerMock = proxyquire(
      '../src/services/stateMachineManager/CNodeHealthManager.js',
      {
        './../../config': config
      }
    )
    CNodeHealthManagerMock.determinePeerHealth(verboseHealthCheckResp)
  }

  it("doesn't throw if all data is healthy (empty data counts as healthy)", function () {
    const baseVerboseHealthCheckResp = {
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
      latestSyncSuccessTimestamp: '2022-06-08T21:29:34.231Z',
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
    expect(() => determinePeerHealth(baseVerboseHealthCheckResp)).to.not.throw()
  })

  it('throws when low on storage space', function () {
    const storagePathSize = 1000
    const storagePathUsed = 990
    const maxStorageUsedPercent = config.get('maxStorageUsedPercent')
    const verboseHealthCheckResp = {
      storagePathSize,
      storagePathUsed
    }
    expect(() => determinePeerHealth(verboseHealthCheckResp)).to.throw(
      `Almost out of storage=${
        storagePathSize - storagePathUsed
      }bytes remaining out of ${storagePathSize}. Requires less than ${maxStorageUsedPercent}% used`
    )
  })

  it('throws when low on memory', function () {
    const usedMemory = 90
    const totalMemory = 100
    const verboseHealthCheckResp = {
      usedMemory,
      totalMemory
    }
    expect(() => determinePeerHealth(verboseHealthCheckResp)).to.throw(
      `Running low on memory=${
        totalMemory - usedMemory
      }bytes remaining. Minimum memory required=${minimumMemoryAvailable}bytes`
    )
  })

  it('throws when low on file descriptor space', function () {
    const allocatedFileDescriptors = 99
    const maxFileDescriptors = 100
    const verboseHealthCheckResp = {
      allocatedFileDescriptors,
      maxFileDescriptors
    }
    expect(() => determinePeerHealth(verboseHealthCheckResp)).to.throw(
      `Running low on file descriptors availability=${
        (allocatedFileDescriptors / maxFileDescriptors) * 100
      }% used. Max file descriptors allocated percentage allowed=${maxFileDescriptorsAllocatedPercentage}%`
    )
  })

  it('throws when historical sync success rate for today is below threshold', function () {
    const dailySyncSuccessCount = 1
    const dailySyncFailCount = 9
    const verboseHealthCheckResp = {
      dailySyncSuccessCount,
      dailySyncFailCount
    }
    expect(() => determinePeerHealth(verboseHealthCheckResp)).to.throw(
      `Latest daily sync data shows that this node fails at a high rate of syncs. Successful syncs=${dailySyncSuccessCount} || Failed syncs=${dailySyncFailCount}. Minimum successful sync percentage=${minimumSuccessfulSyncCountPercentage}%`
    )
  })

  it('throws when historical sync success rate for rolling 30-day window is below threshold', function () {
    const thirtyDayRollingSyncSuccessCount = 1
    const thirtyDayRollingSyncFailCount = 9
    const verboseHealthCheckResp = {
      thirtyDayRollingSyncSuccessCount,
      thirtyDayRollingSyncFailCount
    }
    expect(() => determinePeerHealth(verboseHealthCheckResp)).to.throw(
      `Rolling sync data shows that this node fails at a high rate of syncs. Successful syncs=${thirtyDayRollingSyncSuccessCount} || Failed syncs=${thirtyDayRollingSyncFailCount}. Minimum successful sync percentage=${minimumSuccessfulSyncCountPercentage}%`
    )
  })
})

describe('test CNodeHealthManager -- isPrimaryHealthy()', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  const primary = 'http://cn1.co'
  const gracePeriodSeconds = 1
  config.set('maxNumberSecondsPrimaryRemainsUnhealthy', 1)

  it('returns true (healthy) when healthy', async function () {
    // Make isNodeHealthy return true
    const isNodeHealthyStub = sandbox
      .stub(CNodeHealthManager, 'isNodeHealthy')
      .resolves(true)

    const isHealthy = await CNodeHealthManager.isPrimaryHealthy(primary)
    expect(isHealthy).to.be.true
    expect(isNodeHealthyStub).to.have.been.calledOnceWithExactly(primary, true)
  })

  it('returns true when health check fails during grace period, then false when grace period ends, then true when health check starts passing again', async function () {
    // Mock CNodeHealthManager to use the config with our shorter grace period
    const CNodeHealthManagerMock = proxyquire(
      '../src/services/stateMachineManager/CNodeHealthManager.js',
      {
        './../../config': config
      }
    )
    // Make isNodeHealthy return false
    const isNodeHealthyStub = sandbox
      .stub(CNodeHealthManagerMock, 'isNodeHealthy')
      .resolves(false)

    // Verify that the node is marked as healthy during the grace period (even though it's unhealthy)
    const isHealthy = await CNodeHealthManagerMock.isPrimaryHealthy(primary)
    expect(isHealthy).to.be.true
    const isHealthyDuringGracePeriod =
      await CNodeHealthManagerMock.isPrimaryHealthy(primary)
    expect(isHealthyDuringGracePeriod).to.be.true

    // Verify that the node is unhealthy after the grace period ends
    await Utils.timeout(gracePeriodSeconds * 1000 + 1)
    const isHealthyAfterGracePeriod =
      await CNodeHealthManagerMock.isPrimaryHealthy(primary)
    expect(isHealthyAfterGracePeriod).to.be.false

    // Verify that the node is healthy when the health check starts passing again
    isNodeHealthyStub.returns(true)
    const isHealthyWhenIsHealthCheckPassesAgain =
      await CNodeHealthManagerMock.isPrimaryHealthy(primary)
    expect(isHealthyWhenIsHealthCheckPassesAgain).to.be.true
  })
})

describe('test CNodeHealthManager -- _computeContentNodePeerSet()', function () {
  it('returns correct set of content nodes, filtering out empty endpoints and self', function () {
    const thisContentNode = 'http://thisContentNode.co'
    const users = [
      {
        primary: thisContentNode,
        secondary1: 'http://cn1.co',
        secondary2: 'http://cn2.co'
      },
      {
        primary: thisContentNode,
        secondary1: 'http://cn3.co',
        secondary2: 'http://cn4.co'
      },
      {
        primary: 'http://cn5.co',
        secondary1: 'http://cn2.co',
        secondary2: ''
      }
    ]
    expect(
      CNodeHealthManager._computeContentNodePeerSet(users, thisContentNode)
    ).to.have.all.keys(
      'http://cn1.co',
      'http://cn2.co',
      'http://cn3.co',
      'http://cn4.co',
      'http://cn5.co'
    )
  })
})

describe('test CNodeHealthManager logger', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('logs info and error with common prefix', function () {
    // Initialize CNodeHealthManager with stubbed logger
    const logInfoStub = sandbox.stub()
    const logErrorStub = sandbox.stub()
    const CNodeHealthManagerMock = proxyquire(
      '../src/services/stateMachineManager/CNodeHealthManager.js',
      {
        './../../logging': {
          logger: {
            info: logInfoStub,
            error: logErrorStub
          }
        }
      }
    )

    // Verify that each log function passes the correct message to the logger
    CNodeHealthManagerMock.log('test info msg')
    expect(logInfoStub).to.have.been.calledOnceWithExactly(
      'CNodeHealthManager: test info msg'
    )
    CNodeHealthManagerMock.logError('test error msg')
    expect(logErrorStub).to.have.been.calledOnceWithExactly(
      'CNodeHealthManager ERROR: test error msg'
    )
  })
})
