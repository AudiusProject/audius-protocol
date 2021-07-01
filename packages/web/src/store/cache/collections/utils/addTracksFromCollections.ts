import { UserCollectionMetadata } from 'models/Collection'
import { UserTrackMetadata } from 'models/Track'
import { processAndCacheTracks } from 'store/cache/tracks/utils'

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
