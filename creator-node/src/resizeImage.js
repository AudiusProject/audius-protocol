const Jimp = require('jimp')
const ExifParser = require('exif-parser')
const fs = require('fs-extra')
const path = require('path')
const { logger: genericLogger } = require('./logging')
const { ipfs } = require('./ipfsClient')
const DiskManager = require('./diskManager')
const { ipfsAddWrapper } = require('./ipfsClient')

const MAX_HEIGHT = 6000 // No image should be taller than this.
const COLOR_WHITE = 0xFFFFFFFF
const IMAGE_QUALITY = 90
const MIME_TYPE_JPEG = 'image/jpeg'

/**
 * Returns an image that's been resized, cropped into a square, converted into JPEG, and compressed.
 * @param {string} image the buffer of the image to use
 * @param {number} maxWidth max width of the returned image (default is 1,000px)
 * @param {boolean} square whether or not to square the image
 * @return {Buffer} the converted image
 * @dev TODO - replace with child node process bc need for speed
 */
async function resizeImage (image, maxWidth, square, logger) {
  let img = image.clone()
  // eslint-disable-next-line
  let exif
  let time = Date.now()
  logger.info(`resize image ${maxWidth} - start`)
  try {
    exif = ExifParser.create(img).parse()
    logger.info(`resize image ${maxWidth} - create time ${Date.now() - time}`)
    time = Date.now()
  } catch (error) {
    logger.error(error)
    exif = null
  }

  logger.info(`resize image ${maxWidth} - read time ${Date.now() - time}`)

  img = _exifRotate(img, exif)
  img.background(COLOR_WHITE)
  let width = img.bitmap.width
  let height = img.bitmap.height

  if (square) {
    // If both sides are larger than maxWidth, resizing must occur
    if (width > maxWidth && height > maxWidth) {
      width > height ? img.resize(Jimp.AUTO, maxWidth) : img.resize(maxWidth, Jimp.AUTO)
    }
    // Crop the image to be square
    let min = Math.min(img.bitmap.width, img.bitmap.height)
    img.cover(min, min)
  } else {
    // Resize to max width and crop at crazy height
    if (width > maxWidth) {
      img.resize(maxWidth, Jimp.AUTO)
    }
    img.cover(img.bitmap.width, Math.min(img.bitmap.height, MAX_HEIGHT))
  }

  // Very high quality, decent size reduction
  img.quality(IMAGE_QUALITY)

  return img.getBufferAsync(MIME_TYPE_JPEG)
}

// Copied directly from Jimp.
// https://github.com/oliver-moran/jimp/blob/12248941fd481121dc5372f6a8154f01930c8d0f/packages/core/src/utils/image-bitmap.js#L31
function _exifRotate (img, exif) {
  if (exif && exif.tags && exif.tags.Orientation) {
    switch (exif.tags.Orientation) {
      case 1: // Horizontal (normal)
        // do nothing
        break
      case 2: // Mirror horizontal
        img.mirror(true, false)
        break
      case 3: // Rotate 180
        img.rotate(180, false)
        break
      case 4: // Mirror vertical
        img.mirror(false, true)
        break
      case 5: // Mirror horizontal and rotate 270 CW
        img.rotate(-90, false).mirror(true, false)
        break
      case 6: // Rotate 90 CW
        img.rotate(-90, false)
        break
      case 7: // Mirror horizontal and rotate 90 CW
        img.rotate(90, false).mirror(true, false)
        break
      case 8: // Rotate 270 CW
        img.rotate(-270, false)
        break
      default:
        break
    }
  }

  return img
}

module.exports = async (job) => {
  const {
    file,
    fileName,
    sizes,
    square,
    logContext
  } = job.data
  const logger = genericLogger.child(logContext)

  // Read the image once, clone it later on
  let img
  try {
    img = await Jimp.read(file)
  } catch (e) {
    throw new Error(`Could not generate image buffer during image resize: ${e}`)
  }

  // Resize all the images
  const resizes = await Promise.all(
    Object.keys(sizes).map(size => {
      return resizeImage(img, sizes[size], square, logger)
    })
  )

  // Add all the images to IPFS including the original
  const toAdd = Object.keys(sizes).map((size, i) => {
    return {
      path: path.join(fileName, size),
      content: resizes[i]
    }
  })
  const original = await img.getBufferAsync(MIME_TYPE_JPEG)
  toAdd.push({
    path: path.join(fileName, 'original.jpg'),
    content: original
  })
  resizes.push(original)

  const ipfsAddResp = await ipfsAddWrapper(
    ipfs,
    toAdd,
    { pin: false },
    logContext
  )

  // Write all the images to file storage and
  // return the CIDs and storage paths to write to db
  // in the main thread
  const dirCID = ipfsAddResp[ipfsAddResp.length - 1].hash
  const dirDestPath = DiskManager.computeFilePath(dirCID)

  const resp = {
    dir: { dirCID, dirDestPath },
    files: []
  }

  // Create dir on disk
  await fs.ensureDir(dirDestPath)

  // Save all image file buffers to disk
  try {
    // Slice ipfsAddResp to remove dir entry at last index
    const ipfsFileResps = ipfsAddResp.slice(0, ipfsAddResp.length - 1)

    await Promise.all(ipfsFileResps.map(async (fileResp, i) => {
      // Save file to disk
      const destPath = DiskManager.computeFilePathInDir(dirCID, fileResp.hash)
      await fs.writeFile(destPath, resizes[i])

      // Append saved file info to response object
      resp.files.push({
        multihash: fileResp.hash,
        sourceFile: fileResp.path,
        storagePath: destPath
      })
    }))
  } catch (e) {
    throw new Error(`Failed to write files to disk after resizing ${e}`)
  }

  return Promise.resolve(resp)
}
