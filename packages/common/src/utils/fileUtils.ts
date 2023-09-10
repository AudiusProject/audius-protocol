import { Buffer } from 'buffer'

/** Convert a base64 string to a file object */
export const dataURLtoFile = async (
  dataUrl: string,
  fileName = 'Artwork'
): Promise<File | undefined> => {
  const arr = dataUrl.split(',')
  if (arr.length < 2) {
    return undefined
  }
  const mimeArr = arr[0].match(/:(.*?);/)
  if (!mimeArr || mimeArr.length < 2) {
    return undefined
  }
  const mime = mimeArr[1]
  const buff = Buffer.from(arr[1], 'base64')
  return new File([buff], fileName, { type: mime })
}
