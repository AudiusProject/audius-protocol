const { ipfs } = require('../src/ipfsClient')
const resizeImageJob = require('../src/resizeImage')
const config = require('../src/config')

// const Jimp = require('jimp')
// const ExifParser = require('exif-parser')
// const ipfsClient = require('ipfs-http-client')
const fs = require('fs')
const path = require('path')

const sinon = require('sinon')
const assert = require('assert')

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
        storagePath: 'some/storage/path',
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {} // todo: add working
      }
    }

    try {
      await resizeImageJob(job)
      assert.ok(false)
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
  it('should throw error if ipfs is down', async () => {
    sinon.stub(ipfs, 'add').throws('ipfs is down!')
    const imageBuffer = fs.readFileSync(path.join(__dirname, 'audiusDj.png'))
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
        logContext: {} // todo: add working
      }
    }

    try {
      await resizeImageJob(job)
      assert.ok(false)
    } catch (e) {
      console.error(e)
      assert.ok(true)
    }
  })

  /**
   * Given: we are creating a directory at the destination path
   * When: a bad path is passed in
   * Then: an error is thrown
   */
  it('should throw error if making a directory with new dest path fails', async () => {
    const imageBuffer = fs.readFileSync(path.join(__dirname, 'audiusDj.png'))
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
        logContext: {} // todo: add working
      }
    }

    try {
      await resizeImageJob(job)
      assert.ok(false)
    } catch (e) {
      console.error(e)
      assert.ok(true)
    }
  })

  /**
   * Given: we have successfully created the resized images to add to ipfs
   * When: we add the resized images to ipfs
   * Then: we ensure that what is added to fs is the same as what is added to ipfs
   */
  it('should pass with happy path (square)', async () => {
    const imageBuffer = fs.readFileSync(path.join(__dirname, 'audiusDj.png'))
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath: config.get('storagePath'),
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: {} // todo: add working
      }
    }

    let resizeImageResp
    try {
      resizeImageResp = await resizeImageJob(job)
    } catch (e) {
      console.error(e)
      assert.ok(false)
    }

    // check what is in file_storage matches what is in ipfs
    let ipfsDirContents
    try {
      ipfsDirContents = await ipfs.ls(resizeImageResp.dir.dirCID)
    } catch (e) {
      console.error(e)
      assert.fail('Directory not found in ipfs.')
    }

    // Ensure that there are the same number of files uploaded to ipfs and to disk
    assert.ok(ipfsDirContents.length === resizeImageResp.files.length)

    // If hash found in ipfs is not found in file_storage, fail
    ipfsDirContents.map(ipfsFile => {
      const pathFromIpfs = path.join(resizeImageResp.dir.dirDestPath, ipfsFile.hash)
      if (!fs.existsSync(pathFromIpfs)) {
        assert.fail(`File in ipfs not found in file_storage for size ${ipfsFile.name}`)
      }
    })
  })

  /**
   * Given: we have successfully created the resized images to add to ipfs
   * When: we add the resized images to ipfs
   * Then: we ensure that what is added to fs is the same as what is added to ipfs
   */
  it('should pass with happy path (not square)', async () => {
    const imageBuffer = fs.readFileSync(path.join(__dirname, 'audiusDj.png'))
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath: config.get('storagePath'),
        sizes: {
          '640x.jpg': 640,
          '2000x.jpg': 2000
        },
        square: false,
        logContext: {} // todo: add working
      }
    }

    let resizeImageResp
    try {
      resizeImageResp = await resizeImageJob(job)
    } catch (e) {
      console.error(e)
      assert.ok(false)
    }

    // check what is in file_storage matches what is in ipfs
    let ipfsDirContents
    try {
      ipfsDirContents = await ipfs.ls(resizeImageResp.dir.dirCID)
    } catch (e) {
      console.error(e)
      assert.fail('Directory not found in ipfs.')
    }

    // Ensure that there are the same number of files uploaded to ipfs and to disk
    assert.ok(ipfsDirContents.length === resizeImageResp.files.length)

    // If hash found in ipfs is not found in file_storage, fail
    ipfsDirContents.map(ipfsFile => {
      const pathFromIpfs = path.join(resizeImageResp.dir.dirDestPath, ipfsFile.hash)
      if (!fs.existsSync(pathFromIpfs)) {
        assert.fail(`File in ipfs not found in file_storage for size ${ipfsFile.name}`)
      }
    })
  })
})
