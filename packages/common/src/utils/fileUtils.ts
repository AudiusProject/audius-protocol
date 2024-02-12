import { Buffer } from 'buffer'

import { Nullable } from './typeUtils'
import { DownloadFile } from '~/services'

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

export const getDownloadFilename = ({
  filename,
  isOriginal
}: {
  filename?: Nullable<string>
  isOriginal: boolean
}) => {
  if (!filename) return ''
  if (isOriginal) return filename
  else {
    const split = filename.split('.')
    split.pop()
    return `${split.join('.')}.mp3`
  }
}

export const dedupFilenames = (files: DownloadFile[]) => {
  const filenameCounts = new Map<string, number>()
  for (const file of files) {
    const count = filenameCounts.get(file.filename) ?? 0
    file.filename = count === 0 ? file.filename : `${file.filename}-${count}`
    filenameCounts.set(file.filename, count + 1)
  }
}
