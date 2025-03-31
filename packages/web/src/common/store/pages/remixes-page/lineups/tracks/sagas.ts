import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { Track } from '@audius/common/models'
import {
  accountSelectors,
  remixesPageLineupActions as tracksActions,
  remixesPageActions,
  remixesPageSelectors,
  CommonState,
  getSDK
} from '@audius/common/store'
import { Id, OptionalId } from '@audius/sdk'
import { call, put, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getTrackId, getLineup } = remixesPageSelectors
const { setCount } = remixesPageActions
const getUserId = accountSelectors.getUserId

function* getTracks({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload?: { trackId: number | null }
}) {
  const sdk = yield* getSDK()
  const { trackId } = payload ?? {}
  if (!trackId) return []
  yield* waitForRead()

  const currentUserId = yield* select(getUserId)

  const { data = { count: 0, tracks: [] } } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getTrackRemixes],
    {
      trackId: Id.parse(trackId),
      offset,
      limit,
      userId: OptionalId.parse(currentUserId)
    }
  )

  const tracks = transformAndCleanList(data.tracks, userTrackMetadataFromSDK)

  yield* put(setCount({ count: data.count }))

  const processedTracks = yield* call(processAndCacheTracks, tracks)

  return processedTracks
}

const sourceSelector = (state: CommonState) =>
  `${tracksActions.prefix}:${getTrackId(state)}`

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
