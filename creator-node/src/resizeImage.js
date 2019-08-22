const Jimp = require('jimp')
const ExifParser = require('exif-parser')

const CRAZY_HEIGHT = 6000 // No image should be taller than this.
const COLOR_WHITE = 0xFFFFFFFF
const IMAGE_QUALITY = 90
const MIME_TYPE_JPEG = 'image/jpeg'

/**
 * Returns an image that's been resized, cropped into a square, converted into JPEG, and compressed.
 * @param {Object} req
 * @param {string} imageBuffer the buffer of the image to use
 * @param {number} maxWidth max width of the returned image (default is 1,000px)
 * @param {boolean} square whether or not to square the image
 * @return {Buffer} the converted image
 */
async function resizeImage (req, imageBuffer, maxWidth, square) {
  // eslint-disable-next-line
  let exif
  try {
    exif = ExifParser.create(imageBuffer).parse()
  } catch (error) {
    req.logger.error(error)
    exif = null
  }

  let img = await Jimp.read(imageBuffer)
  
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
    img.cover(img.bitmap.width, Math.min(img.bitmap.height, CRAZY_HEIGHT))
  }

  // Very high quality, decent size reduction
  img.quality(IMAGE_QUALITY)

  return img.getBufferAsync(MIME_TYPE_JPEG)
}

// Copied directly from Jimp.
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

module.exports = resizeImage