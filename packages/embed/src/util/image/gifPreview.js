import WebWorker from '../WebWorker'

import workerCode from './gifPreview.worker'

const worker = new WebWorker(workerCode, false)

export const gifPreview = async (imageUrl) => {
  worker.call({ imageUrl }, imageUrl)
  return worker.getResult(imageUrl)
}
