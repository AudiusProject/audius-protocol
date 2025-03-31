import { isContentUSDCPurchaseGated } from '@audius/common/models'
import type { TrackMetadataForUpload } from '@audius/common/store'

import type { FormValues } from './types'

export const getUploadMetadataFromFormValues = (
  values: FormValues,
  initialValues: FormValues | TrackMetadataForUpload
) => {
  const {
    licenseType: ignoredLicenseType,
    trackArtwork: ignoredTrackArtwork,
    isCover,
    ...formValues
  } = values

  const metadata: TrackMetadataForUpload = {
    ...formValues,
    bpm: formValues.bpm ? Number(formValues.bpm) : null
  }

  if (isCover) {
    metadata.cover_original_song_title =
      metadata.cover_original_song_title ?? ''
    metadata.cover_original_artist = metadata.cover_original_artist ?? ''
  }

  // If track is not unlisted and one of the unlisted visibility fields is false, set to true.
  // We shouldn't have to do this if we set the default for 'share' and 'play_count' to true
  // in newTrackMetadata, but not sure why they default to false.
  if (!metadata.is_unlisted) {
    const unlistedVisibilityFields = [
      'genre',
      'mood',
      'tags',
      'share',
      'play_count'
    ]
    const shouldOverrideVisibilityFields = !unlistedVisibilityFields.every(
      (field) => metadata.field_visibility?.[field]
    )
    if (shouldOverrideVisibilityFields) {
      metadata.field_visibility = {
        ...metadata.field_visibility,
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true,
        remixes: !!metadata.field_visibility?.remixes
      }
    }
  }

  const streamConditions = metadata.stream_conditions
  let previewStartSeconds = metadata.preview_start_seconds
  let isDownloadable = metadata.is_downloadable
  let isOriginalAvailable = metadata.is_original_available

  // If track is usdc gated, then price and preview need to be parsed into numbers before submitting
  if (isContentUSDCPurchaseGated(streamConditions)) {
    // If user did not set usdc gated track preview, default it to 0
    previewStartSeconds = Number(previewStartSeconds ?? 0)

    // track is downloadable and lossless files are provided by default if track is usdc purchase gated
    // unless it was already usdc purchase gated
    const { download_conditions: initialDownloadConditions } = initialValues
    isDownloadable = !isContentUSDCPurchaseGated(initialDownloadConditions)
      ? true
      : isDownloadable
    isOriginalAvailable = !isContentUSDCPurchaseGated(initialDownloadConditions)
      ? true
      : isOriginalAvailable
  }

  // set the fields back into the metadata
  metadata.stream_conditions = streamConditions
  metadata.preview_start_seconds = previewStartSeconds
  metadata.is_downloadable = isDownloadable
  metadata.is_original_available = isOriginalAvailable

  // download conditions should inherit from stream conditions if track is stream gated
  // this will be updated once the UI for download gated tracks is implemented
  if (streamConditions) {
    metadata.download_conditions = streamConditions
    metadata.is_download_gated = true
  }

  return metadata
}
