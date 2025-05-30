import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { Track } from '@audius/common/models'
import {
  accountSelectors,
  premiumTracksPageLineupSelectors,
  premiumTracksPageLineupActions,
  getSDK
} from '@audius/common/store'
import { OptionalId } from '@audius/sdk'
import { call, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'

const { getUserId } = accountSelectors
const { getLineup } = premiumTracksPageLineupSelectors

function* getPremiumTracks({
  offset,
  limit
}: {
  offset: number
  limit: number
}) {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)
  const { data = [] } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getTrendingUSDCPurchaseTracks],
    { limit, offset, userId: OptionalId.parse(currentUserId) }
  )
  const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)
  const processedTracks = yield* call(processAndCacheTracks, tracks)
  return processedTracks
}

class PremiumTracksSagas extends LineupSagas<Track> {
  constructor() {
    super(
      premiumTracksPageLineupActions.prefix,
      premiumTracksPageLineupActions,
      getLineup,
      getPremiumTracks,
      undefined,
      true,
      undefined
    )
  }
}

export default function sagas() {
  return new PremiumTracksSagas().getSagas()
}
