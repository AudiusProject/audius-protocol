import type { UploadTrack } from '@audius/common'
import {
  ALLOWED_AUDIO_FILE_EXTENSIONS,
  ALLOWED_AUDIO_FILE_MIME,
  ALLOWED_MAX_AUDIO_SIZE_BYTES,
  newTrackMetadata
} from '@audius/common'
import type { DocumentPickerResponse } from 'react-native-document-picker'
import TrackPlayer from 'react-native-track-player'

export const processTrackFile = async (
  trackFile: DocumentPickerResponse
): Promise<UploadTrack> => {
  const { name, size, fileCopyUri, uri, type } = trackFile
  if (size && size > ALLOWED_MAX_AUDIO_SIZE_BYTES) {
    throw new Error('File too large')
  }
  // Check file extension (heuristic for failure)
  if (
    !ALLOWED_AUDIO_FILE_EXTENSIONS.some((ext) =>
      name?.trim().toLowerCase().endsWith(ext)
    )
  ) {
    throw new Error('Unsupported file type')
  }
  // If the mime type is somehow undefined or it doesn't begin with audio/ reject.
  // Backend will try to match on mime again and if it's not an audio/ match, it'll error
  if (type && !type.match(ALLOWED_AUDIO_FILE_MIME)) {
    throw new Error('File must be an audio file')
  }

  await TrackPlayer.add(
    {
      id: 'uploadTrack',
      url: fileCopyUri ?? uri
    },
    0
  )

  const duration = await TrackPlayer.getDuration()

  const title = name?.replace(/\.[^/.]+$/, '') ?? null // strip file extension

  return {
    file: { ...trackFile, uri: fileCopyUri ?? uri },
    preview: null,
    metadata: newTrackMetadata({
      title,
      artwork: null,
      duration
    })
  }
}
