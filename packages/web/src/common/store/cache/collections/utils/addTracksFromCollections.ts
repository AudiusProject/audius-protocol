import { CollectionMetadata, UserTrackMetadata } from '@audius/common/models'
// Move all to web

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

export function* addTracksFromCollections(
  metadataArray: Array<CollectionMetadata>
) {
  const tracks: UserTrackMetadata[] = []

  metadataArray.forEach((m) => {
    if (m.tracks) {
      m.tracks.forEach((t) => {
        tracks.push(t)
      })
    }
  })
  yield processAndCacheTracks(tracks)
}
