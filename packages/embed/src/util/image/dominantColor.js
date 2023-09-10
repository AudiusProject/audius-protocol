import WebWorker from '../WebWorker'

import workerCode from './dominantColor.worker.js'

const worker = new WebWorker(workerCode, false)

export const getDominantColor = async (imageUrl) => {
  worker.call({ imageUrl }, imageUrl)
  return worker.getResult(imageUrl)
}
