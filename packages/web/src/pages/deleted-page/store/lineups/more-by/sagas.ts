import { Track } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { call, select } from 'typed-redux-saga'

import { LineupSagas } from 'common/store/lineup/sagas'
import { retrieveUserTracks } from 'common/store/pages/profile/lineups/tracks/retrieveUserTracks'
import {
  PREFIX,
  moreByActions
} from 'pages/deleted-page/store/lineups/more-by/actions'
import { getLineup } from 'pages/deleted-page/store/selectors'
import { waitForRead } from 'utils/sagaHelpers'
const getUserId = accountSelectors.getUserId

function* getTracks({
  payload
}: {
  offset: number
  limit: number
  payload?: { handle: string }
}) {
  const { handle } = payload ?? {}

  yield* waitForRead()
  const currentUserId = yield* select(getUserId)
  const processed = yield* call(retrieveUserTracks, {
    handle: handle!,
    currentUserId,
    sort: 'plays',
    limit: 5
  })

  return processed
}

const sourceSelector = () => PREFIX

class MoreBySagas extends LineupSagas<Track> {
  constructor() {
    super(
      PREFIX,
      moreByActions,
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new MoreBySagas().getSagas()
}
