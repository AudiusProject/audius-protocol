import type {
  OfflineCollectionMetadata,
  ID,
  OfflineTrackMetadata
} from '@audius/common/models'

import type { CollectionId } from './slice'

export const addOfflineTrack = (
  offlineTrackMetadata: Record<ID, OfflineTrackMetadata>,
  trackId: ID,
  metadata: OfflineTrackMetadata
) => {
  const existingMetadata = offlineTrackMetadata[trackId]
  if (!existingMetadata) {
    offlineTrackMetadata[trackId] = metadata
    return
  }

  const downloadReasons = existingMetadata.reasons_for_download

  for (const downloadReason of metadata.reasons_for_download) {
    const isDuplicateReason = downloadReasons.some(
      (existingReason) =>
        existingReason.collection_id === downloadReason.collection_id &&
        existingReason.is_from_favorites === downloadReason.is_from_favorites
    )
    if (!isDuplicateReason) {
      downloadReasons.push(downloadReason)
    }
  }

  offlineTrackMetadata[trackId] = {
    ...existingMetadata,
    ...metadata,
    reasons_for_download: downloadReasons
  }

  return offlineTrackMetadata
}

export const addOfflineCollection = (
  offlineCollectionMetadata: {
    [Key in CollectionId]?: OfflineCollectionMetadata
  },
  collectionId: CollectionId,
  metadata: OfflineCollectionMetadata
) => {
  const existingMetadata = offlineCollectionMetadata[collectionId]
  if (!existingMetadata) {
    offlineCollectionMetadata[collectionId] = metadata
    return
  }

  const downloadReasons = existingMetadata.reasons_for_download

  for (const downloadReason of metadata.reasons_for_download) {
    const isDuplicateReason = downloadReasons.some(
      (existingReason) =>
        existingReason.is_from_favorites === downloadReason.is_from_favorites
    )
    if (!isDuplicateReason) {
      downloadReasons.push(downloadReason)
    }
  }
  offlineCollectionMetadata[collectionId] = {
    ...existingMetadata,
    ...metadata,
    reasons_for_download: downloadReasons
  }
}

export const removeOfflineTrack = (
  offlineTrackMetadata: Record<ID, OfflineTrackMetadata>,
  trackId: ID,
  metadata: OfflineTrackMetadata
) => {
  const existingMetadata = offlineTrackMetadata[trackId]
  if (!existingMetadata) {
    return
  }

  const downloadReasons = existingMetadata.reasons_for_download.filter(
    (downloadReason) => {
      const shouldDeleteReason = metadata.reasons_for_download.some(
        (existingReason) =>
          existingReason.collection_id === downloadReason.collection_id &&
          existingReason.is_from_favorites === downloadReason.is_from_favorites
      )
      return !shouldDeleteReason
    }
  )

  if (downloadReasons.length === 0) {
    delete offlineTrackMetadata[trackId]
  } else {
    offlineTrackMetadata[trackId] = {
      ...existingMetadata,
      ...metadata,
      reasons_for_download: downloadReasons
    }
  }
}

export const removeOfflineCollection = (
  offlineCollectionMetadata: {
    [Key in CollectionId]?: OfflineCollectionMetadata
  },
  collectionId: CollectionId,
  metadata: OfflineCollectionMetadata
) => {
  const existingMetadata = offlineCollectionMetadata[collectionId]
  if (!existingMetadata) {
    return
  }

  const downloadReasons = existingMetadata.reasons_for_download.filter(
    (downloadReason) => {
      const shouldDeleteReason = metadata.reasons_for_download.some(
        (existingReason) =>
          existingReason.is_from_favorites === downloadReason.is_from_favorites
      )
      return !shouldDeleteReason
    }
  )

  if (downloadReasons.length === 0) {
    delete offlineCollectionMetadata[collectionId]
  } else {
    offlineCollectionMetadata[collectionId] = {
      ...existingMetadata,
      ...metadata,
      reasons_for_download: downloadReasons
    }
  }
}
