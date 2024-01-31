import {
  feedPageLineupActions as feedActions,
  feedPageActions as discoverActions,
  usersSocialActions as socialActions
} from '@audius/common/store'

import { FollowSource, ID } from '@audius/common/models'
import { getErrorMessage } from '@audius/common/utils'
import { call, put, take, fork, takeEvery } from 'redux-saga/effects'

import { fetchUsers } from 'common/store/cache/users/sagas'
import feedSagas from 'common/store/pages/feed/lineup/sagas'
import { fetchSuggestedFollowUserIds } from 'common/store/pages/signon/sagas'
import { waitForRead, waitForWrite } from 'utils/sagaHelpers'

function* fetchSuggestedFollowUsers() {
  yield call(waitForRead)
  try {
    const userIds: ID[] = yield call(fetchSuggestedFollowUserIds)
    yield put(discoverActions.setSuggestedFollows(userIds))
    yield call(fetchUsers, userIds)
  } catch (error) {
    console.error(getErrorMessage(error))
  }
}

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

function* watchFetchSuggestedFollowUsers() {
  yield takeEvery(
    discoverActions.FETCH_SUGGESTED_FOLLOW_USERS,
    fetchSuggestedFollowUsers
  )
}

function* watchFollowUsers() {
  yield takeEvery(discoverActions.FOLLOW_USERS, followUsers)
}

export default function sagas() {
  return [...feedSagas(), watchFetchSuggestedFollowUsers, watchFollowUsers]
}
