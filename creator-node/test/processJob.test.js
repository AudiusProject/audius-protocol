const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')

describe('test processJob() util function', function () {
  let sandbox
  beforeEach(async function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(async function () {
    sandbox.restore()
  })

  it('handles error when processing job', async function () {
    // Mock the logger that processJob() uses
    const loggerStub = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub()
    }
    const createChildLogger = sinon.stub().returns(loggerStub)
    const processJob = proxyquire(
      '../src/services/stateMachineManager/processJob.js',
      {
        '../../logging': {
          createChildLogger
        }
      }
    )

    // Set variables to run the job with
    const jobName = 'jobName'
    const job = { id: 1, data: {} }
    const errorMsg = 'test error message'
    const jobProcessor = sinon.stub().rejects(errorMsg)
    const parentLogger = {}

    // Verify that errors are caught and logged when processing job
    return expect(
      processJob(jobName, job, jobProcessor, parentLogger)
    ).to.eventually.be.fulfilled.and.deep.equal({
      error: errorMsg
    })
  })
})
