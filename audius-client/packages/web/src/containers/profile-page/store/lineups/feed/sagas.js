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
import { getTracks } from 'store/cache/tracks/selectors'

function* getReposts({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  const profileId = yield select(getProfileUserId)
  const currentUserId = yield select(getUserId)
  const reposts = yield call(retrieveUserReposts, {
    handle,
    currentUserId,
    offset,
    limit
  })

  // If we're on our own profile, add any
  // tracks that haven't confirmed yet
  if (profileId === currentUserId) {
    const repostIds = new Set(reposts.map(r => r.track_id).filter(Boolean))
    const tracks = yield select(getTracks)
    for (const track of Object.values(tracks)) {
      if (track.has_current_user_reposted && !repostIds.has(track.track_id)) {
        reposts.push(track)
      }
    }
  }

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
