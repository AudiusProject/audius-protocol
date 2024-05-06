import { FollowSource, ID } from '@audius/common/models'
import {
  feedPageLineupActions as feedActions,
  feedPageActions as discoverActions,
  usersSocialActions as socialActions
} from '@audius/common/store'
import { getErrorMessage } from '@audius/common/utils'
import { call, put, take, fork, takeEvery } from 'redux-saga/effects'

import feedSagas from 'common/store/pages/feed/lineup/sagas'
import { waitForWrite } from 'utils/sagaHelpers'

function* waitForFollow(userIds: ID[]) {
  const usersConfirmed = Array.from(Array(userIds.length)).map(() => false)
  while (!usersConfirmed.every(Boolean)) {
    const action:
      | ReturnType<typeof socialActions.followUserSucceeded>
      | ReturnType<typeof socialActions.followUserFailed> = yield take([
      socialActions.FOLLOW_USER_SUCCEEDED,
      socialActions.FOLLOW_USER_FAILED
    ])
    const userIdx = userIds.findIndex((uid) => uid === action.userId)
    if (userIdx !== -1) usersConfirmed[userIdx] = true
  }
}

function* confirmFollowsAndRefresh(userIds: ID[]) {
  yield call(waitForFollow, userIds)
  yield put(feedActions.refreshInView(true))
}

function* followUsers(action: ReturnType<typeof discoverActions.followUsers>) {
  yield call(waitForWrite)
  try {
    yield put(feedActions.setLoading())
    yield fork(confirmFollowsAndRefresh, action.userIds)
    for (const userId of action.userIds) {
      yield put(socialActions.followUser(userId, FollowSource.EMPTY_FEED))
    }
  } catch (error) {
    console.error(getErrorMessage(error))
  }
}

function* watchFollowUsers() {
  yield takeEvery(discoverActions.FOLLOW_USERS, followUsers)
}

export default function sagas() {
  return [...feedSagas(), watchFollowUsers]
}
