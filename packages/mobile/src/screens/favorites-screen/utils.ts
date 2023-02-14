import type { Collection, ID } from '@audius/common'

import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

export const buildCollectionIdsToNumPlayableTracksMap = (
  collections: Collection[],
  isOffline: boolean,
  offlineDownloadStatus: Record<ID, OfflineDownloadStatus | undefined>
) => {
  if (!isOffline) {
    return collections.reduce((res, nextCollection) => {
      res[nextCollection.playlist_id] =
        nextCollection.playlist_contents.track_ids.length
      return res
    }, {})
  }
  // Else, if we're in offline mode, count the # of downloaded tracks within each collection:
  return collections.reduce((res, nextCollection) => {
    const trackIds =
      nextCollection.playlist_contents?.track_ids?.map(
        (trackData) => trackData.track
      ) ?? []
    const numPlayableTracks = trackIds.filter((trackId) => {
      return (
        offlineDownloadStatus[trackId.toString()] ===
        OfflineDownloadStatus.SUCCESS
      )
    }).length
    res[nextCollection.playlist_id] = numPlayableTracks
    return res
  }, {})
}
