import {
  accountSelectors,
  trendingUndergroundPageLineupSelectors,
  trendingUndergroundPageLineupActions,
  getContext
} from '@audius/common/store'
import {} from '@audius/common'
import { StringKeys } from '@audius/common/services'
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
  const apiClient = yield* getContext('apiClient')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield call(remoteConfigInstance.waitForRemoteConfig)

  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.UTF)?.split(',') ?? []
  )

  const currentUserId = yield* select(getUserId)

  let tracks = yield* call((args) => apiClient.getTrendingUnderground(args), {
    currentUserId,
    limit,
    offset
  })

  if (TF.size > 0) {
    tracks = tracks.filter((t) => {
      const shaId = keccak_256(t.track_id.toString())
      return !TF.has(shaId)
    })
  }

  const processed = yield* processAndCacheTracks(tracks)
  return processed
}

class UndergroundTrendingSagas extends LineupSagas {
  constructor() {
    super(
      trendingUndergroundPageLineupActions.prefix,
      trendingUndergroundPageLineupActions,
      getLineup,
      getTrendingUnderground
    )
  }
}

const sagas = () => new UndergroundTrendingSagas().getSagas()
export default sagas
