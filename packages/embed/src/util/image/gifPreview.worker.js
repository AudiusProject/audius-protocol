/* globals Jimp */

import { logError } from '../logError'

export default () => {
  const script = `${process.env.PREACT_APP_HOST_PREFIX}/static/scripts/jimp.min.js`
  // eslint-disable-next-line
  importWorkerScript(script)

  /**
   * Returns a jpeg of a gif
   * @param {string} key identifies this computation
   * @param {string} imageUrl url of the image to use
   */
  const gifPreview = ({ key, imageUrl }) => {
    Jimp.read({
      url: imageUrl
    })
      .then((img) => {
        if (
          process.env.PREACT_APP_ENVIRONMENT !== 'production' ||
          process.env.SHOW_ERROR_LOGS
        ) {
          self.console.log(imageUrl, img)
        }
        const mimeType = 'image/jpeg'
        img.getBufferAsync(mimeType).then((buffer) => {
          // eslint-disable-next-line
          let convertedBlob = new self.Blob([buffer], { type: mimeType })
          // eslint-disable-next-line
          postMessage({ key, result: convertedBlob })
        })
      })
      .catch((err) => {
        logError(imageUrl, err)
        // eslint-disable-next-line
        postMessage({ key, result: new Blob() })
      })
  }

  // eslint-disable-next-line
  self.addEventListener('message', (e) => {
    if (!e) return
    gifPreview(JSON.parse(e.data))
  })
}
