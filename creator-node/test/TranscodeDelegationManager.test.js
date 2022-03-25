const assert = require('assert')
const sinon = require('sinon')
const uuid = require('uuid')

const TestUtils = require('./lib/utils')
const { getLibsMock } = require('./lib/libsMock')

const { logger: genericLogger } = require('../src/logging')
const Utils = require('../src/utils')
const TranscodeDelegationManager = require('../src/components/tracks/TranscodeDelegationManager')

describe('test TranscodeDelegationManager', function () {
  let libsMock, reqMock, logger
  beforeEach(async () => {
    libsMock = getLibsMock()
    reqMock = {
      logContext: { env: 'TranscodeDelegationManager test' },
      fileDir: 'testFileDir',
      fileName: 'testFileName.mp3',
      fileNameNoExtension: 'testFileName',
      uuid: uuid.v4(),
      libs: libsMock
    }
    logger = genericLogger.child(reqMock.logContext)
  })

  afterEach(async function () {
    sinon.restore()
  })

  // handOff()

  it('If selecting random sps fails, return empty response', async function () {
    sinon
      .stub(TranscodeDelegationManager, 'selectRandomSPs')
      .rejects(new Error('i have failed'))

    const resp = await TranscodeDelegationManager.handOff(
      { logContext: reqMock.logContext },
      reqMock
    )

    assert.ok(TestUtils.deepEqual({}, resp))
  })

  // selectRandomSPs()

  it('Selecting random SPs for transcode handoff works as expected', async function () {
    const allSPs = libsMock.ethContracts.getServiceProviderList('content-node')
    const allSPsSet = new Set(allSPs.map((sp) => sp.endpoint))

    // Return 3 SPs for libs
    let randomSPs = await TranscodeDelegationManager.selectRandomSPs(libsMock)
    assert.strictEqual(randomSPs.length, 3)
    randomSPs.forEach((sp) => {
      assert.ok(allSPsSet.has(sp))
    })

    // Mock libs call to only return 1 sp
    libsMock.ethContracts.getServiceProviderList = () => {
      return allSPs.slice(0, 1)
    }

    // Return 1 SP for libs
    let oneSP = await TranscodeDelegationManager.selectRandomSPs(libsMock)
    assert.strictEqual(oneSP.length, 1)
    assert.ok(allSPsSet.has(oneSP[0]))
  })

  // handOffToSP()

  it('When handing off transcode request to an sp, if the health check fails, throw error', async function () {
    sinon
      .stub(TranscodeDelegationManager, 'fetchHealthCheck')
      .rejects(new Error('failed to fetch health check response'))

    let resp
    try {
      resp = await TranscodeDelegationManager.handOffToSp(logger, {
        sp: 'http://some_cn.com',
        req: reqMock
      })
      assert.fail('Should not have passed')
    } catch (e) {
      assert.ok(e.message === 'failed to fetch health check response')
    }
  })

  it('When handing off transcode request to an sp, if the health check passes but transcode req does not, throw error', async function () {
    sinon.stub(TranscodeDelegationManager, 'fetchHealthCheck').resolves()

    sinon
      .stub(TranscodeDelegationManager, 'sendTranscodeAndSegmentRequest')
      .rejects(new Error('failed to send transcode and segment request'))

    let resp
    try {
      resp = await TranscodeDelegationManager.handOffToSp(logger, {
        sp: 'http://some_cn.com',
        req: reqMock
      })
      assert.fail('Should not have passed')
    } catch (e) {
      assert.ok(e.message === 'failed to send transcode and segment request')
    }
  })

  it('When handing off transcode request to an sp, if both the health check and transcode passes, return uuid', async function () {
    sinon.stub(TranscodeDelegationManager, 'fetchHealthCheck').resolves()

    const expectedUuid = uuid.v4()
    sinon
      .stub(TranscodeDelegationManager, 'sendTranscodeAndSegmentRequest')
      .resolves(expectedUuid)

    try {
      const actualUuid = await TranscodeDelegationManager.handOffToSp(logger, {
        sp: 'http://some_cn.com',
        req: reqMock
      })
      assert.strictEqual(actualUuid, expectedUuid)
    } catch (e) {
      assert.fail(
        `Transcode handoff failed and UUID was not returned: ${e.message}`
      )
    }
  })

  it('When polling for transcode, if polling fails, throw error', async function () {
    sinon.stub(TranscodeDelegationManager, 'fetchHealthCheck').resolves()

    const expectedUuid = uuid.v4()
    sinon
      .stub(TranscodeDelegationManager, 'sendTranscodeAndSegmentRequest')
      .resolves(expectedUuid)

    sinon
      .stub(TranscodeDelegationManager, 'asyncRetry')
      .rejects(new Error('polling failed'))

    try {
      const actualUuid = await TranscodeDelegationManager.handOffToSp(logger, {
        sp: 'http://some_cn.com',
        req: reqMock
      })

      await TranscodeDelegationManager.pollForTranscode(logger, {
        sp: 'http://some_cn.com',
        uuid: actualUuid
      })
      assert.fail(`If polling failed, fn should have thrown`)
    } catch (e) {
      assert.ok(e.message === 'polling failed')
    }
  })

  it('When fetching segment and writing to fs, if fetching fails, throw error and no files from this call are written to tmp dir', async function () {
    sinon
      .stub(TranscodeDelegationManager, 'fetchSegment')
      .rejects(new Error('fetching segment failed'))

    try {
      await TranscodeDelegationManager.fetchFilesAndWriteToFs(logger, {
        fileNameNoExtension: reqMock.fileNameNoExtension,
        transcodeFilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.mp3`,
        segmentFileNames: ['segment00000.ts'],
        segmentFilePaths: [
          `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/segments/segment00000.ts`
        ],
        m3u8FilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.m3u8`
      })
      assert.fail('if fetching segment fails, should not pass')
      // TODO: assert that the files are removed
    } catch (e) {
      assert.ok(e.message === 'fetching segment failed')
    }
  })

  it('When fetching transcode and writing to fs, if fetching fails, throw error and no files from this call are written to tmp dir', async function () {
    sinon.stub(Utils, 'writeStreamToFileSystem').resolves()
    sinon
      .stub(TranscodeDelegationManager, 'fetchSegment')
      .resolves({ data: 'some stream' })
    sinon
      .stub(TranscodeDelegationManager, 'fetchTranscode')
      .rejects(new Error('fetching transcode failed'))

    try {
      await TranscodeDelegationManager.fetchFilesAndWriteToFs(logger, {
        fileNameNoExtension: reqMock.fileNameNoExtension,
        transcodeFilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.mp3`,
        segmentFileNames: ['segment00000.ts'],
        segmentFilePaths: [
          `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/segments/segment00000.ts`
        ],
        m3u8FilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.m3u8`
      })
      assert.fail('if fetching transcode fails, should not pass')
      // TODO: assert that the files are removed
    } catch (e) {
      assert.ok(e.message === 'fetching transcode failed')
    }
  })

  it('When fetching m3u8 and writing to fs, if fetching fails, throw error and no files from this call are written to tmp dir', async function () {
    sinon.stub(Utils, 'writeStreamToFileSystem').resolves()
    sinon
      .stub(TranscodeDelegationManager, 'fetchSegment')
      .resolves({ data: 'some stream' })
    sinon
      .stub(TranscodeDelegationManager, 'fetchTranscode')
      .resolves({ data: 'some more stream' })
    sinon
      .stub(TranscodeDelegationManager, 'fetchM3U8File')
      .rejects(new Error('fetching m3u8 failed'))

    try {
      await TranscodeDelegationManager.fetchFilesAndWriteToFs(logger, {
        fileNameNoExtension: reqMock.fileNameNoExtension,
        transcodeFilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.mp3`,
        segmentFileNames: ['segment00000.ts'],
        segmentFilePaths: [
          `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/segments/segment00000.ts`
        ],
        m3u8FilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.m3u8`
      })
      assert.fail('if fetching m3u8 fails, should not pass')
      // TODO: assert that the files are removed
    } catch (e) {
      assert.ok(e.message === 'fetching m3u8 failed')
    }
  })

  it('When fetching files and writing to fs, if fetching succeeds, return the file paths', async function () {
    sinon.stub(Utils, 'writeStreamToFileSystem').resolves()
    sinon
      .stub(TranscodeDelegationManager, 'fetchSegment')
      .resolves({ data: 'some stream' })
    sinon
      .stub(TranscodeDelegationManager, 'fetchTranscode')
      .resolves({ data: 'some more stream' })
    sinon
      .stub(TranscodeDelegationManager, 'fetchM3U8File')
      .resolves({ data: 'some more more stream' })

    try {
      const resp = await TranscodeDelegationManager.fetchFilesAndWriteToFs(
        logger,
        {
          fileNameNoExtension: reqMock.fileNameNoExtension,
          transcodeFilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.mp3`,
          segmentFileNames: ['segment00000.ts'],
          segmentFilePaths: [
            `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/segments/segment00000.ts`
          ],
          m3u8FilePath: `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.m3u8`
        }
      )

      assert.strictEqual(
        resp.transcodeFilePath,
        `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.mp3`
      )
      assert.strictEqual(resp.segmentFileNames.length, 1)
      assert.strictEqual(resp.segmentFileNames[0], 'segment00000.ts')
      assert.strictEqual(
        resp.m3u8FilePath,
        `/test_file_storage/files/tmp_track_artifacts/${reqMock.uuid}/${reqMock.uuid}.m3u8`
      )
    } catch (e) {
      assert.fail('if fetching files succeed, should not err')
    }
  })
})
