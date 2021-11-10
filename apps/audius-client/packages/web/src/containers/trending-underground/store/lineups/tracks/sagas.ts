import { call, select } from 'redux-saga/effects'

import { Track, UserTrackMetadata } from 'common/models/Track'
import { getUserId } from 'common/store/account/selectors'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { StringKeys } from 'services/remote-config'
import {
  getRemoteVar,
  waitForRemoteConfig
} from 'services/remote-config/Provider'
import { LineupSagas } from 'store/lineup/sagas'

import { PREFIX, trendingUndergroundLineupActions } from './actions'
import { getLineup } from './selectors'

function* getTrendingUnderground({
  limit,
  offset
}: {
  limit: number
  offset: number
}) {
  yield call(waitForRemoteConfig)
  const TF = new Set(getRemoteVar(StringKeys.UTF)?.split(',') ?? [])

  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  let tracks: UserTrackMetadata[] = yield call(
    args => apiClient.getTrendingUnderground(args),
    {
      currentUserId,
      limit,
      offset
    }
  )
  if (TF.size > 0) {
    tracks = tracks.filter(t => {
      const shaId = window.Web3.utils.sha3(t.track_id.toString())
      return !TF.has(shaId)
    })
  }

  const processed: Track[] = yield processAndCacheTracks(tracks)
  return processed
}

class UndergroundTrendingSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      trendingUndergroundLineupActions,
      getLineup,
      getTrendingUnderground
    )
  }
}

const sagas = () => new UndergroundTrendingSagas().getSagas()
export default sagas
