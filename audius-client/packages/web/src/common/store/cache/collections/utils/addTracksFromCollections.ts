import { UserCollectionMetadata } from 'common/models/Collection'
import { UserTrackMetadata } from 'common/models/Track'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

export function* addTracksFromCollections(
  metadataArray: Array<UserCollectionMetadata>
) {
  const tracks: UserTrackMetadata[] = []

  metadataArray.forEach(m => {
    if (m.tracks) {
      m.tracks.forEach(t => {
        tracks.push(t)
      })
    }
  })
  yield processAndCacheTracks(tracks)
}
