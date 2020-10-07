import { select, call } from 'redux-saga/effects'

import {
  PREFIX,
  feedActions
} from 'containers/profile-page/store/lineups/feed/actions'
import {
  getProfileUserId,
  getProfileFeedLineup,
  getProfileUserHandle
} from 'containers/profile-page/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { getUserId } from 'store/account/selectors'
import { retrieveUserReposts } from './retrieveUserReposts'

function* getReposts({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  const currentUserId = yield select(getUserId)

  const reposts = yield call(retrieveUserReposts, {
    handle,
    currentUserId,
    offset,
    limit
  })
  return reposts
}

const sourceSelector = state => `${PREFIX}:${getProfileUserId(state)}`

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      feedActions,
      getProfileFeedLineup,
      getReposts,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}
