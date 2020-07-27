const { segmentFile } = require('../src/ffmpeg')

const path = require('path')
const fs = require('fs')
const assert = require('assert')

describe('test segmentFile', () => {
  // Create the segments directory to store segments in
  before(() => {
    const segmentsDirPath = path.join(__dirname, 'segments')
    if (!fs.existsSync(segmentsDirPath)) {
      try {
        fs.mkdirSync(segmentsDirPath)
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
      console.error(e)
      assert.ok(e)
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
      console.error(e)
      assert.ok(e)
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
      console.error(e)
      assert.fail(e)
    }

    // read segments assets from /test-segments
    const testSegmentsPath = path.join(fileDir, 'test-segments')
    fs.readdir(testSegmentsPath, (err, files) => {
      if (err) assert.fail(`Could not read directory at ${testSegmentsPath}`)

      // check that testTrack.mp3 that 32 track segments are written
      assert.deepStrictEqual(files.length, 32)

      const allSegmentsSet = new Set(files)
      files.map(file => {
        // check that the segment exists
        assert.ok(fs.existsSync(path.join(fileDir, 'segments', file)))

        // check that the segment is proper by comparing its buffer to test assets
        const testGeneratedSegmentBuf = fs.readFileSync(path.join(fileDir, 'segments', file))
        const expectedSegmentBuf = fs.readFileSync(path.join(testSegmentsPath, file))
        assert.deepStrictEqual(expectedSegmentBuf.compare(testGeneratedSegmentBuf), 0)

        allSegmentsSet.delete(file)
      })

      // check that all the expected segments were found
      assert.deepStrictEqual(allSegmentsSet.size, 0)
    })
  })
})
