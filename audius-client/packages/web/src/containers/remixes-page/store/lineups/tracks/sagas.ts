import { select } from 'redux-saga-test-plan/matchers'
import { call, put } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import {
  PREFIX,
  tracksActions
} from 'containers/remixes-page/store/lineups/tracks/actions'
import { getTrackId, getLineup } from 'containers/remixes-page/store/selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { LineupSagas } from 'store/lineup/sagas'
import { AppState } from 'store/types'

import { setCount } from '../../slice'

function* getTracks({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload: { trackId: number | null }
}) {
  const { trackId } = payload
  if (!trackId) return []

  const currentUserId = yield select(getUserId)
  const { tracks, count } = yield call(args => apiClient.getRemixes(args), {
    trackId,
    offset,
    limit,
    currentUserId
  })

  yield put(setCount({ count }))
  const processedTracks = yield call(processAndCacheTracks, tracks)

  return processedTracks
}

const sourceSelector = (state: AppState) => `${PREFIX}:${getTrackId(state)}`

class TracksSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      tracksActions,
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
