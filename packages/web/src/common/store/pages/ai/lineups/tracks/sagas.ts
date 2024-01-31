import {
  accountSelectors,
  aiPageLineupActions as tracksActions,
  aiPageActions,
  aiPageSelectors,
  getContext,
  CommonState
} from '@audius/common/store'
import { call, put, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getAiUserHandle, getLineup } = aiPageSelectors
const { setCount } = aiPageActions
const getUserId = accountSelectors.getUserId

function* getTracks({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload: { aiUserHandle: string | null }
}) {
  const apiClient = yield* getContext('apiClient')
  const { aiUserHandle } = payload
  if (!aiUserHandle) return []
  yield* waitForRead()

  const currentUserId = yield* select(getUserId)
  const tracks = yield* call([apiClient, apiClient.getUserAiTracksByHandle], {
    handle: aiUserHandle,
    offset,
    limit,
    currentUserId,
    getUnlisted: false
  })

  const count = tracks.length

  yield* put(setCount({ count }))

  const processedTracks = yield* call(processAndCacheTracks, tracks)

  return processedTracks
}

const sourceSelector = (state: CommonState) =>
  `${tracksActions.prefix}:${getAiUserHandle(state)}`

class TracksSagas extends LineupSagas {
  constructor() {
    super(
      tracksActions.prefix,
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
