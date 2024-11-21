import * as fileType from 'file-type'
import { z } from 'zod'

/**
 * Type representing a file in Node environment
 */
const NodeFileSchema = z.object({
  buffer: z.custom<Buffer>((data: unknown) => data),
  name: z.optional(z.string()),
  type: z.optional(z.string())
})
export type NodeFile = z.infer<typeof NodeFileSchema>

const BrowserFileSchema = z.custom<File>((data: unknown) => data)
export type BrowserFile = z.infer<typeof BrowserFileSchema>

/**
 * Type representing a file in Node and browser environments
 */
export const CrossPlatformFileSchema = z.union([
  NodeFileSchema,
  BrowserFileSchema
])
export type CrossPlatformFile = z.infer<typeof CrossPlatformFileSchema>

export const isNodeFile = (file: CrossPlatformFile): file is NodeFile => {
  if (file && (file as NodeFile).buffer) {
    return true
  }
  return false
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/tiff',
  'image/gif',
  'image/webp'
]

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/aiff',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/wav',
  'audio/vnd.wave'
]

const getFileType = async (file: CrossPlatformFile) => {
  let fileTypeBrowser: any
  if (typeof window !== 'undefined' && window) {
    fileTypeBrowser = await import('file-type/browser')
  }

  if (isNodeFile(file)) {
    return file.type
      ? { mime: file.type }
      : await fileType.fromBuffer(file.buffer)
  } else {
    return await fileTypeBrowser.fromBlob(file)
  }
}

export const ImageFile = CrossPlatformFileSchema.refine(async (file) => {
  const fileType = await getFileType(file)
  return fileType && ALLOWED_IMAGE_MIME_TYPES.includes(fileType.mime)
}, `Image file has invalid file type. Supported file types are: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`)

export const AudioFile = CrossPlatformFileSchema.refine(async (file) => {
  const fileType = await getFileType(file)
  return fileType && ALLOWED_AUDIO_MIME_TYPES.includes(fileType.mime)
}, `Audio file has invalid file type. Supported file types are: ${ALLOWED_AUDIO_MIME_TYPES.join(', ')}`)
