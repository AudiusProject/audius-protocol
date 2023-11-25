import WebWorker from '../WebWorker'

import dominantColorWorkerFile from './dominantColor.worker.js'
import gifPreviewWorkerFile from './gifPreview.worker.js'
import jimp from './jimp.min.workerscript'

const dominantColorWorker = new WebWorker(dominantColorWorkerFile, false, [
  jimp
])
const gifPreviewWorker = new WebWorker(gifPreviewWorkerFile, false, [jimp])

export const getDominantColor = async (imageUrl) => {
  dominantColorWorker.call({ imageUrl }, imageUrl)
  const colors = await dominantColorWorker.getResult(imageUrl)
  return colors
  // const { r, g, b } = colors[0]
  // return `rgb(${r},${g},${b})`
}

export const gifPreview = async (imageUrl) => {
  gifPreviewWorker.call({ imageUrl }, imageUrl)
  return gifPreviewWorker.getResult(imageUrl)
}
