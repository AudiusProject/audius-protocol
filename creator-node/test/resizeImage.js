// test module.exports
// test resizeImage()
const resizeImageJob = require('../src/resizeImage')

const Jimp = require('jimp')
const ExifParser = require('exif-parser')
const ipfsClient = require('ipfs-http-client')
const fs = require('fs')
const path = require('path')

const sinon = require('sinon')
const assert = require('assert')
const Sinon = require('sinon')
/**
 * Given:
 * When:
 * Then:
 */

/**
  * whgat am i gonna do:
  *
  * - call the method in resizeImage.js
  * - do the thing by dcreating the proper params
  * - test that the behavior is epxected
  */

describe('test resizeImage', () => {
  it('Jimp fails to read with bad image buffer', async () => {
    const imageBuffer = 123
    const job = {
      data: {
        file: imageBuffer,
        fileName: 'audiusDj',
        storagePath: 'some/storage/path', // todo: add working
        sizes: {
          '150x150.jpg': 150,
          '480x480.jpg': 480,
          '1000x1000.jpg': 1000
        },
        square: true,
        logContext: 'logContext' // todo: add working
      }
    }

    assert.rejects(
      async () => {
        await resizeImageJob(job)
      }
    )
  })
})

/**
 * Given:
 * When:
 * Then:
 */
