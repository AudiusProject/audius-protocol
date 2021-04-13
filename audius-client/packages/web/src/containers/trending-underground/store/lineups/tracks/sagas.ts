import { PREFIX, trendingUndergroundLineupActions } from './actions'
import { LineupSagas } from 'store/lineup/sagas'
import { getLineup } from './selectors'
import { call, select } from 'redux-saga/effects'
import { getUserId } from 'store/account/selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import Track, { UserTrackMetadata } from 'models/Track'
import { processAndCacheTracks } from 'store/cache/tracks/utils'

function* getTrendingUnderground({
  limit,
  offset
}: {
  limit: number
  offset: number
}) {
  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  const tracks: UserTrackMetadata[] = yield call(
    args => apiClient.getTrendingUnderground(args),
    {
      currentUserId,
      limit,
      offset
    }
  )

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
