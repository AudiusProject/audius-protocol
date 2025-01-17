import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { Track } from '@audius/common/models'
import {
  accountSelectors,
  aiPageLineupActions as tracksActions,
  aiPageActions,
  aiPageSelectors,
  CommonState,
  getSDK
} from '@audius/common/store'
import { OptionalId } from '@audius/sdk'
import { call, put, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getLineup, getAiUserHandle } = aiPageSelectors
const { setCount } = aiPageActions
const getUserId = accountSelectors.getUserId

function* getTracks({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload?: { aiUserHandle: string | null }
}) {
  const sdk = yield* getSDK()
  const { aiUserHandle } = payload ?? {}
  if (!aiUserHandle) return []
  yield* waitForRead()

  const currentUserId = yield* select(getUserId)
  const { data = [] } = yield* call(
    [sdk.full.users, sdk.full.users.getAIAttributedTracksByUserHandle],
    {
      handle: aiUserHandle,
      offset,
      limit,
      userId: OptionalId.parse(currentUserId),
      filterTracks: 'public',
      sort: 'date'
    }
  )

  const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)
  const count = tracks.length

  yield* put(setCount({ count }))

  const processedTracks = yield* call(processAndCacheTracks, tracks)

  return processedTracks
}

const sourceSelector = (state: CommonState) =>
  `${tracksActions.prefix}:${getAiUserHandle(state)}`

class TracksSagas extends LineupSagas<Track> {
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
