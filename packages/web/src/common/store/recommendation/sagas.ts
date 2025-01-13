import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { ID } from '@audius/common/models'
import { IntKeys } from '@audius/common/services'
import { getContext, getSDK } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { OptionalId } from '@audius/sdk'
import { call } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

export function* getRecommendedTracks(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  const sdk = yield* getSDK()

  const { data } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getRecommendedTracks],
    {
      genre,
      exclusionList,
      limit: remoteConfigInstance.getRemoteVar(IntKeys.AUTOPLAY_LIMIT) || 10,
      userId: OptionalId.parse(currentUserId)
    }
  )
  const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)
  yield* call(processAndCacheTracks, tracks)
  return tracks
}
