import type { DownloadReason, ID } from '@audius/common'

export type CollectionForDownload = {
  collectionId: ID
  isFavoritesDownload?: boolean
}

export type TrackForDownload = {
  trackId: number
  downloadReason: DownloadReason
  // Timestamp associated with when this track was favorited if the reason
  // is favorites.
  favoriteCreatedAt?: string
}
