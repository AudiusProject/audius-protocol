import { TrackMetadataForUpload } from '~/store/upload'
import { squashNewLines } from '~/utils/formatUtil'
import { formatMusicalKey } from '~/utils/musicalKeys'

export const prepareTrackForUpload = (
  metadata: Partial<TrackMetadataForUpload>
) => {
  const processedMetadata = { ...metadata }

  // Clean up description
  if (processedMetadata.description) {
    processedMetadata.description = squashNewLines(
      processedMetadata.description
    )
  }

  // Format musical key
  if (processedMetadata.musical_key) {
    processedMetadata.musical_key =
      formatMusicalKey(processedMetadata.musical_key) ?? null
  }

  // Format bpm
  if (processedMetadata.bpm) {
    processedMetadata.bpm = Number(processedMetadata.bpm)
  }

  // Clean up artwork if file is not present
  if (
    processedMetadata.artwork &&
    'file' in processedMetadata.artwork &&
    !processedMetadata.artwork?.file
  ) {
    processedMetadata.artwork = null
  }

  return processedMetadata
}
