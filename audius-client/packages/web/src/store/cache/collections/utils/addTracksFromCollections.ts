import { UserCollection } from 'models/Collection'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { UserTrackMetadata } from 'models/Track'

export function* addTracksFromCollections(
  metadataArray: Array<UserCollection>
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
