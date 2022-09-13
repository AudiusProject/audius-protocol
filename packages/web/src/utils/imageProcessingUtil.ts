import WebWorker from 'services/WebWorker'
import averageRgbWorkerFile from 'workers/averageRgb.worker.js'
import dominantColorWorkerFile from 'workers/dominantColor.worker.js'
import gifPreviewWorkerFile from 'workers/gifPreview.worker.js'
import resizeImageWorkerFile from 'workers/resizeImage.worker.js'

const averageRgbWorker = new WebWorker(averageRgbWorkerFile, false)
const dominantColorWorker = new WebWorker(dominantColorWorkerFile, false)
const gifPreviewWorker = new WebWorker(gifPreviewWorkerFile, false)

export const ALLOWED_IMAGE_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/tiff',
  'image/gif',
  'image/webp'
]

export const resizeImage = async (
  imageFile: File,
  maxWidth = 1000,
  square = true,
  key = ''
): Promise<File> => {
  if (!ALLOWED_IMAGE_FILE_TYPES.includes(imageFile.type)) {
    throw new Error('invalid file type')
  }
  const imageUrlBlob = URL.createObjectURL(imageFile)
  const worker = new WebWorker(resizeImageWorkerFile)
  worker.call({ imageUrl: imageUrlBlob, maxWidth, square }, key)
  return worker.getResult()
}

export const averageRgb = async (imageUrl: string, chunkSize = 100) => {
  averageRgbWorker.call({ imageUrl, chunkSize }, imageUrl)
  return averageRgbWorker.getResult(imageUrl)
}

export const dominantColor = async (imageUrl: string) => {
  dominantColorWorker.call({ imageUrl }, imageUrl)
  return dominantColorWorker.getResult(imageUrl)
}

export const gifPreview = async (imageUrl: string) => {
  gifPreviewWorker.call({ imageUrl }, imageUrl)
  return gifPreviewWorker.getResult(imageUrl)
}
