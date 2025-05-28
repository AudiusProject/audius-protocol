import { primeTrackDataSaga } from '@audius/common/api'
import { CollectionMetadata, UserTrackMetadata } from '@audius/common/models'
import { call } from 'typed-redux-saga'

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
  yield* call(primeTrackDataSaga, tracks)
}
