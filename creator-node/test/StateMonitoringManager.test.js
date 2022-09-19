/* eslint-disable no-unused-expressions */
const nock = require('nock')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const proxyquire = require('proxyquire')
const BullQueue = require('bull')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const StateMonitoringManager = require('../src/services/stateMachineManager/stateMonitoring')
const {
  QUEUE_NAMES
} = require('../src/services/stateMachineManager/stateMachineConstants')

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

  function getProcessJobMock() {
    const loggerStub = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }
    const createChildLogger = sandbox.stub().returns(loggerStub)
    const processJobMock = proxyquire(
      '../src/services/stateMachineManager/processJob.ts',
      {
        '../../logging': {
          createChildLogger
        },
        '../../redis': {
          set: sandbox.stub()
        }
      }
    )
    return { processJobMock, loggerStub }
  }

  it('creates the queue and registers its event handlers', async function () {
    // Mock the latest userId, which is used during init as an upper bound
    // to start the monitoring queue at a random user
    const discoveryNodeEndpoint = 'https://discoveryNodeEndpoint.co'
    nock(discoveryNodeEndpoint).get('/latest/user').reply(200, { data: 0 })

    // Initialize StateMonitoringManager and spy on its registerMonitoringQueueEventHandlersAndJobProcessors function
    const stateMonitoringManager = new StateMonitoringManager()
    sandbox.spy(
      stateMonitoringManager,
      'registerMonitoringQueueEventHandlersAndJobProcessors'
    )
    const {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue
    } = await stateMonitoringManager.init(
      discoveryNodeEndpoint,
      getPrometheusRegistry()
    )

    // Verify that the queue was successfully initialized and that its event listeners were registered
    expect(monitorStateQueue).to.exist.and.to.be.instanceOf(BullQueue)
    expect(findSyncRequestsQueue).to.exist.and.to.be.instanceOf(BullQueue)
    expect(findReplicaSetUpdatesQueue).to.exist.and.to.be.instanceOf(BullQueue)
    expect(cNodeEndpointToSpIdMapQueue).to.exist.and.to.be.instanceOf(BullQueue)
    expect(
      stateMonitoringManager.registerMonitoringQueueEventHandlersAndJobProcessors
    ).to.have.been.calledOnce
    expect(
      stateMonitoringManager.registerMonitoringQueueEventHandlersAndJobProcessors.getCall(
        0
      ).args[0]
    )
      .to.have.property('monitorStateQueue')
      .that.has.deep.property('name', QUEUE_NAMES.MONITOR_STATE)
    expect(
      stateMonitoringManager.registerMonitoringQueueEventHandlersAndJobProcessors.getCall(
        0
      ).args[0]
    )
      .to.have.property('findSyncRequestsQueue')
      .that.has.deep.property('name', QUEUE_NAMES.FIND_SYNC_REQUESTS)
    expect(
      stateMonitoringManager.registerMonitoringQueueEventHandlersAndJobProcessors.getCall(
        0
      ).args[0]
    )
      .to.have.property('findReplicaSetUpdatesQueue')
      .that.has.deep.property('name', QUEUE_NAMES.FIND_REPLICA_SET_UPDATES)
    expect(
      stateMonitoringManager.registerMonitoringQueueEventHandlersAndJobProcessors.getCall(
        0
      ).args[0]
    )
      .to.have.property('cNodeEndpointToSpIdMapQueue')
      .that.has.deep.property(
        'name',
        QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP
      )
  })

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
      'discoveryNodeEndpoint',
      getPrometheusRegistry()
    )

    // Verify that the queue won't process or queue jobs because it's paused
    const isQueuePaused = await monitorStateQueue.isPaused()
    expect(isQueuePaused).to.be.true
    return expect(monitorStateQueue.getJobs('delayed')).to.eventually.be
      .fulfilled.and.be.empty
  })

  it('processes monitorState jobs with expected data and returns the expected results', async function () {
    // Mock StateMonitoringManager to have monitorState job processor return dummy data and mocked processJob util
    const expectedResult = { test: 'test' }
    const processStateMonitoringJobStub = sandbox
      .stub()
      .resolves(expectedResult)
    const { processJobMock, loggerStub } = getProcessJobMock()
    const MockStateMonitoringManager = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/index.js',
      {
        './monitorState.jobProcessor': processStateMonitoringJobStub,
        '../processJob': processJobMock
      }
    )

    // Verify that StateMonitoringManager returns our dummy data
    const job = {
      id: 9,
      data: {
        lastProcessedUserId: 2,
        discoveryNodeEndpoint: 'http://test_endpoint.co'
      }
    }
    await expect(
      new MockStateMonitoringManager().makeProcessMonitorStateJob(
        getPrometheusRegistry()
      )(job)
    ).to.eventually.be.fulfilled.and.deep.equal(expectedResult)
    expect(processStateMonitoringJobStub).to.have.been.calledOnceWithExactly({
      logger: loggerStub,
      lastProcessedUserId: job.data.lastProcessedUserId,
      discoveryNodeEndpoint: job.data.discoveryNodeEndpoint
    })
  })

  it('processes findSyncRequests jobs with expected data and returns the expected results', async function () {
    // Mock StateMonitoringManager to have findSyncRequests job processor return dummy data and mocked processJob util
    const expectedResult = { test: 'test' }
    const processFindSyncRequestsJobStub = sandbox
      .stub()
      .resolves(expectedResult)
    const { processJobMock, loggerStub } = getProcessJobMock()
    const MockStateMonitoringManager = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/index.js',
      {
        './findSyncRequests.jobProcessor': processFindSyncRequestsJobStub,
        '../processJob': processJobMock
      }
    )

    // Verify that StateMonitoringManager returns our dummy data
    const job = {
      id: 9,
      data: {
        users: [],
        unhealthyPeers: [],
        replicaSetNodesToUserClockStatusesMap: {},
        userSecondarySyncMetricsMap: {}
      }
    }
    await expect(
      new MockStateMonitoringManager().makeProcessFindSyncRequestsJob(
        getPrometheusRegistry()
      )(job)
    ).to.eventually.be.fulfilled.and.deep.equal(expectedResult)
    expect(processFindSyncRequestsJobStub).to.have.been.calledOnceWithExactly({
      logger: loggerStub,
      users: job.data.users,
      unhealthyPeers: job.data.unhealthyPeers,
      replicaSetNodesToUserClockStatusesMap:
        job.data.replicaSetNodesToUserClockStatusesMap,
      userSecondarySyncMetricsMap: job.data.userSecondarySyncMetricsMap
    })
  })

  it('processes findReplicaSetUpdates jobs with expected data and returns the expected results', async function () {
    // Mock StateMonitoringManager to have findReplicaSetUpdates job processor return dummy data and mocked processJob util
    const expectedResult = { test: 'test' }
    const processfindReplicaSetUpdatesJobStub = sandbox
      .stub()
      .resolves(expectedResult)
    const { processJobMock, loggerStub } = getProcessJobMock()
    const MockStateMonitoringManager = proxyquire(
      '../src/services/stateMachineManager/stateMonitoring/index.js',
      {
        './findReplicaSetUpdates.jobProcessor':
          processfindReplicaSetUpdatesJobStub,
        '../processJob': processJobMock
      }
    )

    // Verify that StateMonitoringManager returns our dummy data
    const job = {
      id: 9,
      data: {
        users: [],
        unhealthyPeers: [],
        replicaSetNodesToUserClockStatusesMap: {},
        userSecondarySyncMetricsMap: {}
      }
    }
    await expect(
      new MockStateMonitoringManager().makeProcessFindReplicaSetUpdatesJob(
        getPrometheusRegistry()
      )(job)
    ).to.eventually.be.fulfilled.and.deep.equal(expectedResult)
    expect(
      processfindReplicaSetUpdatesJobStub
    ).to.have.been.calledOnceWithExactly({
      logger: loggerStub,
      users: job.data.users,
      unhealthyPeers: job.data.unhealthyPeers,
      replicaSetNodesToUserClockStatusesMap:
        job.data.replicaSetNodesToUserClockStatusesMap,
      userSecondarySyncMetricsMap: job.data.userSecondarySyncMetricsMap
    })
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
    expect(queueAdd).to.have.been.calledOnceWithExactly({
      lastProcessedUserId: prevJobProcessedUserId,
      discoveryNodeEndpoint: discoveryNodeEndpoint
    })
  })
})
