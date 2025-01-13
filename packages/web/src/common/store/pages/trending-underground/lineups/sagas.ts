import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { Track } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  accountSelectors,
  trendingUndergroundPageLineupSelectors,
  trendingUndergroundPageLineupActions,
  getContext,
  getSDK
} from '@audius/common/store'
import { OptionalId } from '@audius/sdk'
import { keccak_256 } from 'js-sha3'
import { call, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'

const { getLineup } = trendingUndergroundPageLineupSelectors
const getUserId = accountSelectors.getUserId

function* getTrendingUnderground({
  limit,
  offset
}: {
  limit: number
  offset: number
}) {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield call(remoteConfigInstance.waitForRemoteConfig)

  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.UTF)?.split(',') ?? []
  )
  const version = remoteConfigInstance.getRemoteVar(
    StringKeys.UNDERGROUND_TRENDING_EXPERIMENT
  )

  const currentUserId = yield* select(getUserId)

  const { data = [] } = version
    ? yield* call(
        [
          sdk.full.tracks,
          sdk.full.tracks.getUndergroundTrendingTracksWithVersion
        ],
        { version, offset, limit, userId: OptionalId.parse(currentUserId) }
      )
    : yield* call(
        [sdk.full.tracks, sdk.full.tracks.getUndergroundTrendingTracks],
        { offset, limit, userId: OptionalId.parse(currentUserId) }
      )

  let tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

  if (TF.size > 0) {
    tracks = tracks.filter((t) => {
      const shaId = keccak_256(t.track_id.toString())
      return !TF.has(shaId)
    })
  }

  const processed = yield* processAndCacheTracks(tracks)
  return processed
}

class UndergroundTrendingSagas extends LineupSagas<Track> {
  constructor() {
    super(
      trendingUndergroundPageLineupActions.prefix,
      trendingUndergroundPageLineupActions,
      getLineup,
      getTrendingUnderground,
      undefined,
      undefined,
      undefined
    )
  }
}

const sagas = () => new UndergroundTrendingSagas().getSagas()
export default sagas
