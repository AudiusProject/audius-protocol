import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { queryCurrentUserId } from '@audius/common/api'
import { Track } from '@audius/common/models'
import {
  aiPageLineupActions as tracksActions,
  aiPageActions,
  aiPageSelectors,
  CommonState,
  getSDK
} from '@audius/common/store'
import { OptionalId } from '@audius/sdk'
import { call, put } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getAiUserId, getLineup } = aiPageSelectors
const { setCount } = aiPageActions

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

  const currentUserId = yield* call(queryCurrentUserId)
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
  `${tracksActions.prefix}:${getAiUserId(state)}`

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
