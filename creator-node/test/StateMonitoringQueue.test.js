/* eslint-disable no-unused-expressions */
const nock = require('nock')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')
const BullQueue = require('bull')

const config = require('../src/config')
const StateMonitoringQueue = require('../src/services/stateMachineManager/stateMonitoring/StateMonitoringQueue')
const {
  STATE_MONITORING_QUEUE_NAME
} = require('../src/services/stateMachineManager/stateMachineConstants')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

describe('test StateMonitoringQueue initialization and logging', function () {
  let server, sandbox
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()

    config.set('spID', 1)
    nock.disableNetConnect()
  })

  afterEach(async function () {
    await server.close()
    nock.cleanAll()
    nock.enableNetConnect()
    sandbox.restore()
  })

  it('creates the queue and registers its event handlers', async function () {
    // Initialize StateMonitoringQueue and spy on its registerQueueEventHandlers function
    sandbox.spy(StateMonitoringQueue.prototype, 'registerQueueEventHandlers')
    const stateMonitoringQueue = new StateMonitoringQueue(config)
    await stateMonitoringQueue.init(getLibsMock())

    // Verify that the queue was successfully initialized and that its event listeners were registered
    expect(stateMonitoringQueue.queue).to.exist.and.to.be.instanceOf(BullQueue)
    expect(stateMonitoringQueue.registerQueueEventHandlers).to.have.been
      .calledOnce
    expect(stateMonitoringQueue.registerQueueEventHandlers.getCall(0).args[0])
      .to.have.property('queue')
      .that.has.deep.property('name', STATE_MONITORING_QUEUE_NAME)
  })

  it('kicks off an initial job when initting', async function () {
    // Mock the latest userId, which is used during init as an upper bound
    // to start the monitoring queue at a random user
    nock(getLibsMock().discoveryProvider.discoveryProviderEndpoint)
      .get('/latest/user')
      .reply(200, { data: 0 })
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 1)
    config.set('stateMonitoringQueueRateLimitInterval', 60_000)

    // Initialize StateMonitoringQueue
    const stateMonitoringQueue = new StateMonitoringQueue(config)
    await stateMonitoringQueue.init(getLibsMock())

    // Verify that the queue has the correct initial job in it
    return expect(stateMonitoringQueue.queue.getJobs('delayed'))
      .to.eventually.be.fulfilled.and.have.nested.property('[0]')
      .and.nested.include({
        id: '1',
        'data.discoveryNodeEndpoint':
          getLibsMock().discoveryProvider.discoveryProviderEndpoint,
        'data.prevJobFailed': false,
        'data.lastProcessedUserId': 0
      })
  })

  it("doesn't queue or process any jobs when rate limit jobsPerInterval is set to 0", async function () {
    // Mock the latest userId, which is used during init as an upper bound
    // to start the monitoring queue at a random user
    nock(getLibsMock().discoveryProvider.discoveryProviderEndpoint)
      .get('/latest/user')
      .reply(200, { data: 0 })
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 0)
    config.set('stateMonitoringQueueRateLimitInterval', 60_000)

    // Initialize StateMonitoringQueue
    const stateMonitoringQueue = new StateMonitoringQueue(config)
    await stateMonitoringQueue.init(getLibsMock())

    // Verify that the queue won't process or queue jobs because it's paused
    const isQueuePaused = await stateMonitoringQueue.queue.isPaused()
    expect(isQueuePaused).to.be.true
    return expect(stateMonitoringQueue.queue.getJobs('delayed')).to.eventually
      .be.fulfilled.and.be.empty
  })

  it('logs debug, info, warning, and error', function () {
    // Initialize StateMonitoringQueue with stubbed logger
    const logDebugStub = sandbox.stub()
    const logInfoStub = sandbox.stub()
    const logWarnStub = sandbox.stub()
    const logErrorStub = sandbox.stub()
    const MockStateMonitoringQueue = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/StateMonitoringQueue.js',
      {
        './../../../logging': {
          logger: {
            debug: logDebugStub,
            info: logInfoStub,
            warn: logWarnStub,
            error: logErrorStub
          }
        }
      }
    )
    const stateMonitoringQueue = new MockStateMonitoringQueue(config)

    // Verify that each log function passes the correct message to the logger
    stateMonitoringQueue.logDebug('test debug msg')
    expect(logDebugStub).to.have.been.calledOnceWithExactly(
      'StateMonitoringQueue DEBUG: test debug msg'
    )
    stateMonitoringQueue.log('test info msg')
    expect(logInfoStub).to.have.been.calledOnceWithExactly(
      'StateMonitoringQueue: test info msg'
    )
    stateMonitoringQueue.logWarn('test warn msg')
    expect(logWarnStub).to.have.been.calledOnceWithExactly(
      'StateMonitoringQueue WARNING: test warn msg'
    )
    stateMonitoringQueue.logError('test error msg')
    expect(logErrorStub).to.have.been.calledOnceWithExactly(
      'StateMonitoringQueue ERROR: test error msg'
    )
  })
})

describe('test StateMonitoringQueue re-enqueuing', function () {
  let server, sandbox
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()

    config.set('spID', 1)
    nock.disableNetConnect()
  })

  afterEach(async function () {
    await server.close()
    nock.cleanAll()
    nock.enableNetConnect()
    sandbox.restore()
  })

  it('re-enqueues a new job with the correct data after a job completes successfully', async function () {
    // Initialize StateMonitoringQueue and stubbed queue.add()
    const stateMonitoringQueue = new StateMonitoringQueue(config)
    await stateMonitoringQueue.init(getLibsMock())
    const queueAdd = sandbox.stub()

    // Call function that enqueues a new job after the previous job completed successfully
    const prevJobDiscNode = 'testDiscoveryNode'
    const prevJobModuloBase = 10
    const prevJobModuloSlice = 5
    const prevJobProcessedUserIdOnStart = 0 // Should NOT be used for the next job
    const prevJobProcessedUserIdOnEnd = 100 // Should be used for the next job
    const successfulJob = {
      data: {
        lastProcessedUserId: prevJobProcessedUserIdOnStart,
        discoveryNodeEndpoint: prevJobDiscNode,
        moduloBase: prevJobModuloBase,
        currentModuloSlice: prevJobModuloSlice
      }
    }
    const successfulJobResult = {
      lastProcessedUserId: prevJobProcessedUserIdOnEnd,
      jobFailed: false
    }
    stateMonitoringQueue.enqueueJobAfterSuccess(
      { add: queueAdd },
      successfulJob,
      successfulJobResult
    )

    // Verify that the queue has the correct initial job in it
    expect(queueAdd).to.have.been.calledOnceWithExactly({
      lastProcessedUserId: prevJobProcessedUserIdOnEnd,
      discoveryNodeEndpoint: prevJobDiscNode,
      moduloBase: prevJobModuloBase,
      currentModuloSlice: (prevJobModuloSlice + 1) % prevJobModuloBase
    })
  })

  it('re-enqueues a new job with the correct data after a job fails', async function () {
    // Initialize StateMonitoringQueue and stubbed queue.add()
    const stateMonitoringQueue = new StateMonitoringQueue(config)
    await stateMonitoringQueue.init(getLibsMock())
    const queueAdd = sandbox.stub()

    // Call function that enqueues a new job after the previous job failed
    const prevJobDiscNode = 'testDiscoveryNode'
    const prevJobModuloBase = 10
    const prevJobModuloSlice = 5
    const prevJobProcessedUserId = 100
    const failedJob = {
      data: {
        lastProcessedUserId: prevJobProcessedUserId,
        discoveryNodeEndpoint: prevJobDiscNode,
        moduloBase: prevJobModuloBase,
        currentModuloSlice: prevJobModuloSlice
      }
    }
    stateMonitoringQueue.enqueueJobAfterFailure({ add: queueAdd }, failedJob)

    // Verify that the queue has the correct initial job in it
    expect(queueAdd).to.have.been.calledOnceWithExactly({
      lastProcessedUserId: prevJobProcessedUserId,
      discoveryNodeEndpoint: prevJobDiscNode,
      moduloBase: prevJobModuloBase,
      currentModuloSlice: (prevJobModuloSlice + 1) % prevJobModuloBase
    })
  })
})
