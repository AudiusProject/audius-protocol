/* eslint-disable no-unused-expressions */
const nock = require('nock')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const proxyquire = require('proxyquire')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const StateMonitoringManager = require('../src/services/stateMachineManager/stateMonitoring')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

describe('test StateMonitoringManager initialization, events, and re-enqueuing', function () {
  let server, sandbox
  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()

    nock.disableNetConnect()
  })

  afterEach(async function () {
    await server.close()
    nock.cleanAll()
    nock.enableNetConnect()
    sandbox.restore()
  })

  function getPrometheusRegistry() {
    const startTimerStub = sandbox.stub().returns(() => {})
    const startQueueMetricsStub = sandbox.stub().returns(() => {})
    const getMetricStub = sandbox.stub().returns({
      startTimer: startTimerStub
    })
    const prometheusRegistry = {
      getMetric: getMetricStub,
      startQueueMetrics: startQueueMetricsStub,
      metricNames: {}
    }
    return prometheusRegistry
  }

  it('kicks off an initial job when initting', async function () {
    // Mock the latest userId, which is used during init as an upper bound
    // to start the monitoring queue at a random user
    const discoveryNodeEndpoint = 'https://discoveryNodeEndpoint.co'
    nock(discoveryNodeEndpoint).get('/latest/user').reply(200, { data: 0 })
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 1)
    config.set('stateMonitoringQueueRateLimitInterval', 60_000)
    const MockStateMonitoringManager = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/index.js',
      {
        cluster: {
          worker: {
            id: 1
          }
        },
        '../../../config': config
      }
    )

    // Initialize StateMonitoringManager
    const stateMonitoringManager = new MockStateMonitoringManager()
    const { monitorStateQueue } = await stateMonitoringManager.init(
      discoveryNodeEndpoint,
      getPrometheusRegistry()
    )
    await monitorStateQueue.getJobs('delayed')

    // Verify that the queue has the correct initial job in it
    return expect(monitorStateQueue.getJobs('delayed'))
      .to.eventually.be.fulfilled.and.have.nested.property('[0]')
      .and.nested.include({
        id: '1',
        'data.discoveryNodeEndpoint': discoveryNodeEndpoint,
        'data.lastProcessedUserId': 0
      })
  })

  it("doesn't queue or process any jobs when rate limit jobsPerInterval is set to 0", async function () {
    // Mock config and latest userId, which is used during init as an upper bound
    // to start the monitoring queue at a random user
    nock('discoveryNodeEndpoint').get('/latest/user').reply(200, { data: 0 })
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 0)
    config.set('stateMonitoringQueueRateLimitInterval', 60_000)
    const MockStateMonitoringManager = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/index.js',
      {
        '../../../config': config
      }
    )

    // Initialize StateMonitoringManager
    const stateMonitoringManager = new MockStateMonitoringManager()
    const { monitorStateQueue } = await stateMonitoringManager.init(
      'discoveryNodeEndpoint',
      getPrometheusRegistry()
    )

    // Verify that the queue won't process or queue jobs because it's paused
    const isQueuePaused = await monitorStateQueue.isPaused()
    expect(isQueuePaused).to.be.true
    return expect(monitorStateQueue.getJobs('delayed')).to.eventually.be
      .fulfilled.and.be.empty
  })

  it('re-enqueues a new job with the correct data after a job fails', async function () {
    // Initialize StateMonitoringManager and stubbed queue.add()
    const discoveryNodeEndpoint = 'http://test_dn.co'
    const stateMonitoringManager = new StateMonitoringManager()
    await stateMonitoringManager.init(
      discoveryNodeEndpoint,
      getPrometheusRegistry()
    )
    const queueAdd = sandbox.stub()

    // Call function that enqueues a new job after the previous job failed
    const prevJobProcessedUserId = 100
    const failedJob = {
      data: {
        lastProcessedUserId: prevJobProcessedUserId,
        discoveryNodeEndpoint: discoveryNodeEndpoint
      }
    }
    stateMonitoringManager.enqueueMonitorStateJobAfterFailure(
      { add: queueAdd },
      failedJob
    )

    // Verify that the queue has the correct initial job in it
    expect(queueAdd).to.have.been.calledOnceWithExactly('retry-after-failure', {
      lastProcessedUserId: prevJobProcessedUserId,
      discoveryNodeEndpoint: discoveryNodeEndpoint
    })
  })
})
