const { ipfs } = require('../src/ipfsClient')
const ipfsAdd = require('../src/ipfsAdd')
const resizeImageJob = require('../src/resizeImage')
const config = require('../src/config')
const DiskManager = require('../src/diskManager')

const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const assert = require('assert')

// Image buffer for audiusDj.png test image
const imageTestDir = 'resizeImageAssets'
const imageBuffer = fs.readFileSync(path.join(__dirname, imageTestDir, 'audiusDj.png'))

let storagePath = config.get('storagePath')

// CIDs for audiusDj.png
const DIR_CID_SQUARE = 'QmNfiyESzN4rNQikeHUiF4HBfAEKF38DTo1JtiDMukqwE9'
const CID_1000 = 'QmZg29dJohTJdNodaiLrKcdTBhRhnbHcCijt3i88juyKzh'
const CID_480 = 'QmcThUoKmADpRZmQCNa8W88tcBCHjhSpU8qCWRETks7bAR'
const CID_150 = 'QmSFGj6Hos2RPjGnogeZ1AgNa8tAsdLFYg4tfzMxyLi4Mh'
const DIR_CID_NOT_SQUARE = 'QmNWhyJ7UrWUjpnFhxVSefAsr2etbuYYLfAb3TSC4DujjY'
const CID_640 = 'QmQmsktPHnTvneXpYYLCMmbE8xVp7wRGvmw1nX4zX2dS3v'
const CID_2000 = 'QmdjTLFVyGyzG3pVRsQLSGQq9bK2T2bdth65wrW8xMQZDg'
const CID_ORIGINAL = 'QmWAMpnZo2TC45mnENxXsPPdCDk5osDKEt7vY1FEU3x28L'

describe('test resizeImage', () => {
  afterEach(function () {
    sinon.restore()
  })
  /**
   * Given: the param image buffer is bad
   * When: Jimp reads a bad image buffer
   * Then: an error is thrown
   */
  it('should throw error if Jimp reads a bad image buffer', async () => {
    const imageBuffer = 123
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath,
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
      assert.fail('Should not have passed if Jimp reads bad image buffer')
    } catch (e) {
      console.error(e)
      assert.ok(e.message.includes('Could not generate image buffer during image resize'))
    }
  })

  /**
   * Given: we are adding the successfully resized images to ipfs
   * When: adding to ipfs fails
   * Then: an error is thrown
   */
  it('should not throw error if ipfs is down', async () => {
    sinon.stub(ipfsAdd, 'ipfsAddImages').throws(new Error('ipfs add wrapper failed!'))
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath,
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
    } catch (e) {
      assert.ok(e.message.includes('ipfs add wrapper failed!'))
    }
  })

  /**
   * Given: we are creating a directory at the destination path
   * When: a bad path is passed in
   * Then: an error is thrown
   */
  it('should throw error if making a directory with new dest path fails', async () => {
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath: 'some/storage/path',
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
      assert.fail('Should not have passed if making new directory at path fails')
    } catch (e) {
      console.error(e)
      assert.ok(e.message)
    }
  })

  /**
   * Given: we have successfully resized the images (square)
   * When: the images are added to the filesystem
   * Then: the images should:
   *  - be added in the proper file system path
   *  - correctly resized (150x150, 480x480, 1000x1000, original)
   *  - is not corrupted
   */
  it('should pass with proper contents added to filesystem (square)', async () => {
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath,
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
    } catch (e) {
      console.error(e)
      assert.fail(e)
    }

    // Check fs contains the dir for square cids
    const dirPath = DiskManager.computeFilePath(DIR_CID_SQUARE)
    assert.ok(fs.existsSync(dirPath))

    const dirContentCIDs = new Set([CID_150, CID_480, CID_1000, CID_ORIGINAL])

    // Iterate through fs files
    fs.readdir(dirPath, (err, files) => {
      if (err) assert.fail(`Could not read directory at ${dirPath}`)

      // Check that 4 files (tentatively 150x150, 480x480, 1000x1000, original) are present
      assert.deepStrictEqual(files.length, 4)

      files.map(file => {
        // Check that (150x150, 480x480, 1000x1000, original) files exist
        assert.ok(dirContentCIDs.has(file))

        // Check (150x150, 480x480, 1000x1000, original) file contents are proper
        // by comparing the buffers
        const fsBuf = fs.readFileSync(path.join(dirPath, file))
        const expectedBuf = fs.readFileSync(path.join(__dirname, imageTestDir, DIR_CID_SQUARE, file))
        // If comparison does not return 0, buffers are not the same
        assert.deepStrictEqual(fsBuf.compare(expectedBuf), 0)

        // Remove from set to test that only unique files are added
        dirContentCIDs.delete(file)
      })
    })
  })

  /**
   * Given: we have successfully created the resized images to add to ipfs
   * When: we add the resized images to ipfs
   * Then: we ensure that what is added to fs is the same as what is added to ipfs
   */
  it('should be properly added to ipfs (square)', async () => {
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath,
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
    } catch (e) {
      console.error(e)
      assert.fail(e)
    }

    // check what is in file_storage matches what is in ipfs
    let ipfsDirContents
    try {
      ipfsDirContents = await ipfs.ls(DIR_CID_SQUARE)
    } catch (e) {
      console.error(e)
      assert.fail('Directory not found in ipfs.')
    }

    // Ensure that there are the same number of files uploaded to ipfs and to disk
    assert.ok(ipfsDirContents.length === 4)

    // If hash found in ipfs is not found in file_storage, fail
    ipfsDirContents.map(ipfsFile => {
      const fsPathForIpfsFile = DiskManager.computeFilePathInDir(DIR_CID_SQUARE, ipfsFile.hash)
      if (!fs.existsSync(fsPathForIpfsFile)) {
        assert.fail(`File in ipfs not found in file_storage for size ${ipfsFile.name}`)
      }
    })
  })

  /**
   * Given: we have successfully resized the images (not square)
   * When: the images are added to the filesystem
   * Then: the images should:
   *  - be added in the proper file system path
   *  - correctly resized (640x, 2400x, original)
   *  - is not corrupted
   */
  it('should pass with proper contents added to filesystem (not square)', async () => {
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath,
        sizes: {
          '640x.jpg': 640,
          '2000x.jpg': 2000
        },
        square: false,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
    } catch (e) {
      console.error(e)
      assert.fail(e)
    }

    // Check fs contains the dir for square cids
    const dirPath = DiskManager.computeFilePath(DIR_CID_NOT_SQUARE)
    assert.ok(fs.existsSync(dirPath))

    const dirContentCIDs = new Set([CID_640, CID_2000, CID_ORIGINAL])

    // Iterate through fs files
    fs.readdir(dirPath, (err, files) => {
      if (err) assert.fail(`Could not read directory at ${dirPath}`)

      // Check that 3 files (tentatively 640x, 2000x, original) are present
      assert.deepStrictEqual(files.length, 3)

      files.map(file => {
        // Check that (640x, 2000x, original) files exist
        assert.ok(dirContentCIDs.has(file))

        // Check (640x, 2000x, original) file contents are proper by comparing the buffers
        const fsBuf = fs.readFileSync(path.join(dirPath, file))
        const expectedBuf = fs.readFileSync(path.join(__dirname, imageTestDir, DIR_CID_NOT_SQUARE, file))
        // If comparison does not return 0, buffers are not the same
        assert.deepStrictEqual(expectedBuf.compare(fsBuf), 0)

        // Remove from set to test that only unique files are added
        dirContentCIDs.delete(file)
      })
    })
  })

  /**
   * Given: we have successfully created the resized images to add to ipfs
   * When: we add the resized images to ipfs
   * Then: we ensure that what is added to fs is the same as what is added to ipfs
   */
  it('should pass with happy path (not square)', async () => {
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath,
        sizes: {
          '640x.jpg': 640,
          '2000x.jpg': 2000
        },
        square: false,
        logContext: {}
      }
    }

    try {
      await resizeImageJob(job)
    } catch (e) {
      console.error(e)
      assert.fail(e)
    }

    // check what is in file_storage matches what is in ipfs
    let ipfsDirContents
    try {
      ipfsDirContents = await ipfs.ls(DIR_CID_NOT_SQUARE)
    } catch (e) {
      console.error(e)
      assert.fail('Directory not found in ipfs.')
    }

    // Ensure that there are the same number of files uploaded to ipfs and to disk
    assert.ok(ipfsDirContents.length === 3)

    // If hash found in ipfs is not found in file_storage, fail
    ipfsDirContents.map(ipfsFile => {
      const fsPathForIpfsFile = DiskManager.computeFilePathInDir(DIR_CID_NOT_SQUARE, ipfsFile.hash)
      if (!fs.existsSync(fsPathForIpfsFile)) {
        assert.fail(`File in ipfs not found in file_storage for size ${ipfsFile.name}`)
      }
    })
  })
})
