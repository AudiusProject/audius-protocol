/* globals Jimp, ExifParser */

/**
 * Note: We include ExifParser (a jimp dependency) directly here
 * because otherwise the package is not correctly resolved and exif data is not
 * parsed correctly. This manifests itself in image orientation (e.g. iPhone photos)
 * getting displayed sideways due to Jimp being unable to parse exif metadata.
 * When we rework webworker implementations when CRA has reasonable native support,
 * this work should be able to be removed. Until then ...
 */

export default () => {
  // eslint-disable-next-line
  const exifParser = '/scripts/exif-parser-0.1.12-min.js'
  // eslint-disable-next-line
  importWorkerScript(exifParser)

  // Copied directly from Jimp.
  function exifRotate(img, exif) {
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

  /**
   * Returns an image that's been resized, cropped into a square, converted into JPEG, and compressed.
   * @param {string} imageUrl the url of the image to use
   * @param {number} maxWidth max size of the returned square (default is 1,000px x 1,000px)
   * @param {boolean} square whether or not to square the image
   * @return a blob of the converted image
   */
  const resizeImage = ({ imageUrl, maxWidth, square }) => {
    const CRAZY_HEIGHT = 6000 // No image should be taller than this.
    // eslint-disable-next-line
    fetch(imageUrl).then(res => {
      res.arrayBuffer().then((buffer) => {
        let exif
        try {
          exif = ExifParser.create(buffer).parse()
        } catch (error) {
          exif = null
        }
        Jimp.read(buffer)
          .then((img) => {
            img = exifRotate(img, exif)
            img.background(0xffffffff)
            const width = img.bitmap.width
            const height = img.bitmap.height

            if (square) {
              // If both sides are larger than maxWidth, resizing must occur
              if (width > maxWidth && height > maxWidth) {
                width > height
                  ? img.resize(Jimp.AUTO, maxWidth)
                  : img.resize(maxWidth, Jimp.AUTO)
              }
              // Crop the image to be square
              const min = Math.min(img.bitmap.width, img.bitmap.height)
              img.cover(min, min)
            } else {
              // Resize to max width and crop at crazy height
              if (width > maxWidth) {
                img.resize(maxWidth, Jimp.AUTO)
              }
              img.cover(
                img.bitmap.width,
                Math.min(img.bitmap.height, CRAZY_HEIGHT)
              )
            }

            // Very high quality, decent size reduction
            img.quality(90)

            const mimeType = 'image/jpeg'
            img.getBufferAsync(mimeType).then((buffer) => {
              // eslint-disable-next-line
            let convertedBlob = new self.Blob([buffer], { type: mimeType })
              // eslint-disable-next-line
            postMessage(convertedBlob)
            })
          })
          .catch((err) => {
            console.error(imageUrl, err)
            // eslint-disable-next-line
          postMessage(false)
          })
      })
    })
  }
  // eslint-disable-next-line
  self.addEventListener('message', e => {
    if (!e) return
    resizeImage(JSON.parse(e.data))
  })
}
