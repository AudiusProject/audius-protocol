import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import {
  PREFIX,
  moreByActions
} from 'containers/deleted-page/store/lineups/more-by/actions'
import { getLineup } from 'containers/deleted-page/store/selectors'
import { retrieveUserTracks } from 'containers/profile-page/store/lineups/tracks/retrieveUserTracks'
import { LineupSagas } from 'store/lineup/sagas'

function* getTracks({
  payload
}: {
  offset: number
  limit: number
  payload: { handle: string }
}) {
  const { handle } = payload
  const currentUserId = yield select(getUserId)
  const processed = yield call(retrieveUserTracks, {
    handle,
    currentUserId,
    sort: 'plays',
    limit: 5
  })

  return processed
}

const sourceSelector = () => PREFIX

class MoreBySagas extends LineupSagas {
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
