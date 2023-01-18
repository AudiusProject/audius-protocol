const path = require('path')
const fs = require('fs-extra')
const assert = require('assert')
const { libs } = require('@audius/sdk')
const Utils = libs.Utils

const { segmentFile, transcodeFileTo320, getFileInformation } = require('../src/ffmpeg')

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

function computeTranscodeDestinationPath (fileDir, fileName) {
  return path.resolve(fileDir, fileName.split('.')[0] + '-dl.mp3')
}

/**
 * Ignores milliseconds bc of inaccuracy in comparison due to how we transcode
 * e.g. Input file info shows:
 *    [mp3 @ 0x72367c0] Estimating duration from bitrate, this may be inaccurate
 *    Duration: 00:03:07.44, start: 0.000000, bitrate: 320 kb/s
 * and output file shows:
 *    Duration: 00:03:07.46, start: 0.023021, bitrate: 320 kb/s
 * Note these durations are the same after accounting for the start offset (not sure why thats there)
 */
async function getAudioFileInformation (filePath) {
  const info = await getFileInformation(filePath)
  if (!info) throw new Error('Failed to get file information')

  let duration = /Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/g.exec(info.toString())
  if (!duration) throw new Error('Failed to find file duration')
  duration = duration[1].split('.')[0]

  let metadata = {}
  // Extract the metadata properties using a regular expression
  const properties = /^\s{4}(\w+)\s+:(.+)/gm
  let match
  while ((match = properties.exec(info.toString())) !== null) {
    metadata[match[1]] = match[2].trim()
  }

  return {
    info,
    duration,
    metadata
  }
}

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
