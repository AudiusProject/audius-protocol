import { Nullable, getContext } from '@audius/common'
import { ID } from '@audius/common/models'
import { call } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

export function* getRecommendedTracks(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const apiClient = yield* getContext('apiClient')
  const tracks = yield* call([apiClient, apiClient.getRecommended], {
    genre,
    exclusionList,
    currentUserId
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}
