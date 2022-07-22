const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const proxyquire = require('proxyquire')

const { logger: defaultLogger } = require('../src/logging')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

describe('test processJob() util function', function () {
  let sandbox
  beforeEach(async function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(async function () {
    sandbox.restore()
  })

  it('requires logger to have a queue property to filter by', async function () {
    // Mock the logger that processJob() uses
    const loggerStub = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }
    const createChildLogger = sandbox.stub().returns(loggerStub)
    const processJob = proxyquire(
      '../src/services/stateMachineManager/processJob.js',
      {
        '../../logging': {
          createChildLogger
        },
        '../../redis': {
          set: sandbox.stub()
        }
      }
    )

    // Set variables to run the job with
    const job = { id: 1, data: {} }
    const errorMsg = 'test error message'
    const jobProcessor = sandbox.stub().rejects(new Error(errorMsg))
    const parentLogger = { error: sandbox.stub() }
    const startTimerStub = sandbox.stub().returns(() => {})
    const getMetricStub = sandbox.stub().returns({
      startTimer: startTimerStub
    })
    const prometheusRegistry = {
      getMetric: getMetricStub,
      metricNames: {}
    }

    // Verify that errors are caught and logged when processing job
    return expect(
      processJob(job, jobProcessor, parentLogger, prometheusRegistry)
    ).to.eventually.be.rejectedWith(
      'Missing required queue property on logger!'
    )
  })

  it('handles error when processing job', async function () {
    // Mock the logger that processJob() uses
    const loggerStub = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }
    const createChildLogger = sandbox.stub().returns(loggerStub)
    const processJob = proxyquire(
      '../src/services/stateMachineManager/processJob.js',
      {
        '../../logging': {
          createChildLogger
        },
        '../../redis': {
          set: sandbox.stub()
        }
      }
    )

    // Set variables to run the job with
    const job = { id: 1, data: {} }
    const errorMsg = 'test error message'
    const jobProcessor = sandbox.stub().rejects(new Error(errorMsg))
    const parentLogger = defaultLogger.child({
      queue: 'queue-name'
    })
    const startTimerStub = sandbox.stub().returns(() => {})
    const getMetricStub = sandbox.stub().returns({
      startTimer: startTimerStub
    })
    const prometheusRegistry = {
      getMetric: getMetricStub,
      metricNames: {}
    }

    // Verify that errors are caught and logged when processing job
    return expect(
      processJob(job, jobProcessor, parentLogger, prometheusRegistry)
    ).to.eventually.be.fulfilled.and.deep.equal({
      error: errorMsg
    })
  })
})
