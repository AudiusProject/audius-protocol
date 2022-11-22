import type { UploadTrack } from '@audius/common'
import { newTrackMetadata } from '@audius/common'
import type { DocumentPickerResponse } from 'react-native-document-picker'

const ALLOWED_MAX_AUDIO_SIZE_BYTES = 250 * 1000 * 1000

export const processTrackFile = (
  trackFile: DocumentPickerResponse
): UploadTrack => {
  const { name, size, fileCopyUri, uri } = trackFile
  if (size && size > ALLOWED_MAX_AUDIO_SIZE_BYTES) {
    throw new Error('File too large')
  }

  const title = name?.replace(/\.[^/.]+$/, '') ?? null // strip file extension

  return {
    file: { ...trackFile, uri: fileCopyUri ?? uri },
    preview: null,
    metadata: newTrackMetadata({
      title,
      artwork: null
    })
  }
}
