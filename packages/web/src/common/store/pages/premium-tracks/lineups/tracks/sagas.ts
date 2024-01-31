import {
  accountSelectors,
  premiumTracksPageLineupSelectors,
  premiumTracksPageLineupActions,
  getContext
} from '@audius/common/store'

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
  const apiClient = yield* getContext('apiClient')
  const currentUserId = yield* select(getUserId)
  const tracks = yield* call([apiClient, apiClient.getPremiumTracks], {
    offset,
    limit,
    currentUserId
  })
  const processedTracks = yield* call(processAndCacheTracks, tracks)
  return processedTracks
}

class PremiumTracksSagas extends LineupSagas {
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
