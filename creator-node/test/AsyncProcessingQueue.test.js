const assert = require('assert')
const sinon = require('sinon')

const uuid = require('uuid')

const { getServiceRegistryMock } = require('./lib/app')
const {
  AsyncProcessingQueue,
  ProcessNames
} = require('../src/AsyncProcessingQueue')

describe('test AsyncProcessingQueue', function () {
  let apq, libsMock, doneMock, serviceRegistryMock
  before(async function () {
    serviceRegistryMock = await getServiceRegistryMock()
    libsMock = {}
    doneMock = () => {}
    apq = new AsyncProcessingQueue(
      libsMock,
      serviceRegistryMock.prometheusRegistry
    )
  })

  afterEach(function () {
    sinon.restore()
  })

  it('If transcode load balance fails, add a track content upload task', async function () {
    sinon
      .stub(apq, 'monitorProgress')
      .callsFake(async (taskName, taskFn, data) => {
        switch (taskName) {
          case ProcessNames.transcodeHandOff: {
            return {}
          }
        }
      })

    let callCount = 0
    sinon.stub(apq, 'addTrackContentUploadTask').callsFake(async () => {
      callCount++
    })

    await apq.processTask(
      {
        data: {
          task: ProcessNames.transcodeHandOff,
          logContext: {
            test: 'test AsyncProcessingQueue',
            requestID: uuid.v4()
          }
        }
      },
      doneMock
    )

    assert.strictEqual(callCount, 1)
  })

  it('If transcode load balance succeeds, do not add another track content upload task', async function () {
    sinon
      .stub(apq, 'monitorProgress')
      .callsFake(async (taskName, taskFn, data) => {
        switch (taskName) {
          case ProcessNames.transcodeHandOff: {
            return {
              transcodeFilePath: 'some/path',
              segmentFileNames: ['name1', 'name2']
            }
          }
        }
      })

    let callCount = 0
    sinon.stub(apq, 'addTrackContentUploadTask').callsFake(async () => {
      callCount++
    })

    await apq.processTask(
      {
        data: {
          task: ProcessNames.transcodeHandOff,
          logContext: {
            test: 'test AsyncProcessingQueue',
            requestID: uuid.v4()
          }
        }
      },
      doneMock
    )

    assert.strictEqual(callCount, 0)
  })
})
