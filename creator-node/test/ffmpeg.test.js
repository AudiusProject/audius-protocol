const path = require('path')
const fs = require('fs-extra')
const assert = require('assert')
const { libs } = require('@audius/sdk')
const Utils = libs.Utils

const { computeTranscodeDestinationPath, getAudioFileInformation } = require('./lib/helpers')

const { segmentFile, transcodeFileTo320 } = require('../src/ffmpeg')

describe('test segmentFile()', () => {
  /**
   * Create the segments directory to store segments in.
   * Middleware would normally handle this, however, in this test
   * context, segmentFile() is unit tested directly without the middleware.
   */
  before(async () => {
    const segmentsDirPath = path.join(__dirname, 'segments')
    if (!(await fs.pathExists(segmentsDirPath))) {
      try {
        await fs.mkdir(segmentsDirPath)
      } catch (e) {
        assert.fail(`Could not create dir at ${segmentsDirPath}: ${e}`)
      }
    }
  })

  /**
   * Given: improper params are passed in
   * When: track segmenting occurs
   * Then: an error is thrown
   */
  it('should throw an error if ffmpeg reads bad params', async () => {
    try {
      await segmentFile(null, null, {})
      assert.fail('Should have thrown error with bad params')
    } catch (e) {
      assert.ok(e.message)
    }
  })

  /**
   * Given: a corrupted track is present (image)
   * Then: an error is thrown
   * When: it is segmented
  */
  it('should throw an error if ffmpeg reads a bad track file (image)', async () => {
    const fileDir = __dirname
    const fileName = 'testTrackWrongFormat.jpg'

    try {
      await segmentFile(fileDir, fileName, {})
      assert.fail('Should have thrown error when segmenting a bad track (image)')
    } catch (e) {
      assert.deepStrictEqual(e.message, 'FFMPEG Error')
    }
  })

  /**
   * Given: a proper track of length 3:07 is present
   * When: it is segmented
   * Then: there are 32 proper track segments present in tests/segments
  */
  it('should properly segment track', async () => {
    const fileDir = __dirname
    const fileName = 'testTrack.mp3'

    try {
      await segmentFile(fileDir, fileName, {})
    } catch (e) {
      assert.fail(e.message)
    }

    // read segments assets from /test-segments
    // TODO - instead of using ./test/test-segments, use ./test/testTrackUploadDir
    const testSegmentsPath = path.join(fileDir, 'test-segments')
    const files = await fs.readdir(testSegmentsPath)

    // check that testTrack.mp3 that 32 track segments are written
    assert.deepStrictEqual(files.length, 32)

    const allSegmentsSet = new Set(files)
    await Promise.all(files.map(async (file, i) => {
      // check that the segment follows naming convention
      const indexSuffix = ('00000' + i).slice(-5)
      assert.deepStrictEqual(file, `segment${indexSuffix}.ts`)

      // check that the segment is proper by comparing its buffer to test assets
      const testGeneratedSegmentBuf = await fs.readFile(path.join(fileDir, 'segments', file))
      const expectedSegmentBuf = await fs.readFile(path.join(testSegmentsPath, file))
      assert.deepStrictEqual(expectedSegmentBuf.compare(testGeneratedSegmentBuf), 0)

      allSegmentsSet.delete(file)
    }))

    // check that all the expected segments were found
    assert.deepStrictEqual(allSegmentsSet.size, 0)
  })
})

describe('test transcodeFileTo320()', () => {
  const fileDir = __dirname
  const fileName = 'testTrack.mp3'
  const inputFilePath = path.resolve(fileDir, fileName)

  // Ensure no file exists at destinationPath
  beforeEach(async () => {
    const destinationPath = computeTranscodeDestinationPath(fileDir, fileName)
    await fs.remove(destinationPath)
  })

  // Ensure no file exists at destinationPath
  after(async () => {
    const destinationPath = computeTranscodeDestinationPath(fileDir, fileName)
    await fs.remove(destinationPath)
  })

  it('Happy path - Transcode file to 320kbps, ensure duration matches input file, and metadata properties correctly defined', async () => {
    const { duration: inputFileDuration } = await getAudioFileInformation(inputFilePath)
    const transcodeFilePath = await transcodeFileTo320(fileDir, fileName, {})
    const { duration: outputFileDuration } = await getAudioFileInformation(transcodeFilePath)
    assert.strictEqual(inputFileDuration, outputFileDuration)
  })

  it('Happy path - Ensure works without overrideIfExists param set', async () => {
    const { duration: inputFileDuration } = await getAudioFileInformation(inputFilePath)
    const transcodeFilePath = await transcodeFileTo320(fileDir, fileName, {})
    const { duration: outputFileDuration } = await getAudioFileInformation(transcodeFilePath)

    assert.strictEqual(inputFileDuration, outputFileDuration)
  })

  it('Confirm same file transcoded with different metadata has different CID but same duration & fileSize', async () => {
    const filePath1 = await transcodeFileTo320(fileDir, fileName, {})
    const { duration: duration1, metadata: metadata1 } = await getAudioFileInformation(filePath1)
    const { size: size1 } = await fs.stat(filePath1)
    const cid1 = await Utils.fileHasher.generateNonImageCid(filePath1)

    // Remove file before re-transcoding
    await fs.remove(filePath1)

    const filePath2 = await transcodeFileTo320(fileDir, fileName, {})
    const { duration: duration2, metadata: metadata2 } = await getAudioFileInformation(filePath2)
    const { size: size2 } = await fs.stat(filePath2)
    const cid2 = await Utils.fileHasher.generateNonImageCid(filePath2)

    assert.strictEqual(filePath1, filePath2)

    // Assert duration and size are same
    assert.strictEqual(duration1, duration2)
    assert.strictEqual(size1, size2)

    // Assert metadata values for fileName and encoder are same, but uuid is different
    assert.strictEqual(metadata1.fileName, metadata2.fileName)
    assert.strictEqual(metadata1.encoder, metadata2.encoder)
    assert.notStrictEqual(metadata1.uuid, metadata2.uuid)

    // Assert CIDs are different
    assert.notStrictEqual(cid1, cid2)
  })
})
