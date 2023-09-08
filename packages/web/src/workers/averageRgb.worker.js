/* globals Jimp */
const DEFAULT_RGB = { r: 13, g: 16, b: 18 }

export default () => {
  const script = '/scripts/jimp.min.js'
  // eslint-disable-next-line
  importWorkerScript(script)

  /**
   * Returns the average RGB of an image to be used for backgrounds/shading, etc.
   * @param {string} key identifies this computation
   * @param {string} imageUrl url of the image to use
   * @param {number} chunkSize visit every N pixels (default = 1 means use each pixel)
   * @return a promise that resolves with the rgb value. This method is necessarily
   * async because many browsers can't get image data until it is finished loading.
   */
  const averageRgb = ({ key, imageUrl, chunkSize }) => {
    const rgb = { r: 0, g: 0, b: 0 }
    let count = 0
    Jimp.read(imageUrl)
      .then((img) => {
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
          ++count
          rgb.r += img.bitmap.data[idx]
          rgb.g += img.bitmap.data[idx + 1]
          rgb.b += img.bitmap.data[idx + 2]
        })
        rgb.r = Math.floor(rgb.r / count)
        rgb.g = Math.floor(rgb.g / count)
        rgb.b = Math.floor(rgb.b / count)
        // eslint-disable-next-line
        postMessage({key, result: rgb})
      })
      .catch((err) => {
        console.error(imageUrl, err)
        // eslint-disable-next-line
        postMessage({key, result: DEFAULT_RGB})
      })
  }

  // eslint-disable-next-line
  self.addEventListener('message', e => {
    if (!e) return
    averageRgb(JSON.parse(e.data))
  })
}
