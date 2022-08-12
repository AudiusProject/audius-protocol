import { call, put, select } from 'typed-redux-saga'

import { getContext } from 'common/store'
import { getUserId } from 'common/store/account/selectors'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import {
  PREFIX,
  tracksActions
} from 'common/store/pages/remixes/lineup/actions'
import { getTrackId, getLineup } from 'common/store/pages/remixes/selectors'
import { setCount } from 'common/store/pages/remixes/slice'
import { LineupSagas } from 'store/lineup/sagas'
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
  const apiClient = yield* getContext('apiClient')
  const { trackId } = payload
  if (!trackId) return []

  const currentUserId = yield* select(getUserId)
  const { tracks, count } = yield* call([apiClient, 'getRemixes'], {
    trackId,
    offset,
    limit,
    currentUserId
  })

  yield* put(setCount({ count }))

  const processedTracks = yield* call(processAndCacheTracks, tracks)

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
