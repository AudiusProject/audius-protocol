/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')

const BullQueue = require('bull')

const StateMonitoringQueue = require('../src/services/stateMachineManager/monitoring/StateMonitoringQueue')
const {
  STATE_MONITORING_QUEUE_NAME
} = require('../src/services/stateMachineManager/constants')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const nodeConfig = require('../src/config')

describe('test StateMonitoringQueue initialization and logging', function () {
  let server, sandbox
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
  })

  afterEach(async function () {
    await server.close()
    sandbox.restore()
  })

  it('creates the queue and registers its event handlers', function () {
    // Initialize StateMonitoringQueue and spy on its registerQueueEventHandlers function
    sandbox.spy(StateMonitoringQueue.prototype, 'registerQueueEventHandlers')
    const stateMonitoringQueue = new StateMonitoringQueue(nodeConfig)

    // Verify that the queue was successfully initialized and that its event listeners were registered
    expect(stateMonitoringQueue.queue).to.exist.and.to.be.instanceOf(BullQueue)
    expect(stateMonitoringQueue.registerQueueEventHandlers).to.have.been
      .calledOnce
    expect(
      stateMonitoringQueue.registerQueueEventHandlers.getCall(0).args[0]
    ).to.have.deep.property('name', STATE_MONITORING_QUEUE_NAME)
  })

  it('kicks off an initial job when initting', async function () {
    // Initialize StateMonitoringQueue
    const stateMonitoringQueue = new StateMonitoringQueue(nodeConfig)
    await stateMonitoringQueue.init(getLibsMock())

    // Verify that the queue has an initial job in it
    expect(
      stateMonitoringQueue.queue.getJobs('delayed')
    ).to.eventually.be.fulfilled.and.have.lengthOf(1)
  })

  it('logs debug, info, warning, and error', function () {
    // Initialize StateMonitoringQueue with stubbed logger
    const logDebugStub = sandbox.stub()
    const logInfoStub = sandbox.stub()
    const logWarnStub = sandbox.stub()
    const logErrorStub = sandbox.stub()
    const MockStateMonitoringQueue = proxyquire(
      '../src/services/stateMachineManager/monitoring/StateMonitoringQueue.js',
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
    const stateMonitoringQueue = new MockStateMonitoringQueue(nodeConfig)

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
