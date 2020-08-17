import { call, put } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'

import {
  PREFIX,
  tracksActions
} from 'containers/remixes-page/store/lineups/tracks/actions'
import { getTrackId, getLineup } from 'containers/remixes-page/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { setCount } from '../../slice'
import { AppState } from 'store/types'

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

  const { tracks, count } = yield call(AudiusBackend.getRemixesOfTrack, {
    trackId,
    offset,
    limit
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
