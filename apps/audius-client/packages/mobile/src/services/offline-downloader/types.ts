import type { DownloadReason } from '@audius/common'

export type CollectionForDownload = {
  collectionId: number
  isFavoritesDownload?: boolean
}

export type TrackForDownload = {
  trackId: number
  downloadReason: DownloadReason
  // Timestamp associated with when this track was favorited if the reason
  // is favorites.
  favoriteCreatedAt?: string
}
