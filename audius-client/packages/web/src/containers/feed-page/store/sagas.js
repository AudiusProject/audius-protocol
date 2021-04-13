import { call, put, take, fork, takeEvery } from 'redux-saga/effects'
import * as discoverActions from 'containers/feed-page/store/actions'
import { feedActions } from 'containers/feed-page/store/lineups/feed/actions'
import * as socialActions from 'store/social/users/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import { fetchSuggestedFollowUserIds } from 'containers/sign-on/store/sagas'
import { fetchUsers } from 'store/cache/users/sagas'

import feedSagas from './lineups/feed/sagas.js'

function* fetchSuggestedFollowUsers() {
  yield call(waitForBackendSetup)
  try {
    const userIds = yield call(fetchSuggestedFollowUserIds)
    yield put(discoverActions.setSuggestedFollows(userIds))
    yield call(fetchUsers, userIds)
  } catch (err) {
    console.error(err.message)
  }
}

function* waitForFollow(userIds) {
  const usersConfirmed = Array.from(Array(userIds.length)).map(() => false)
  while (!usersConfirmed.every(Boolean)) {
    const action = yield take([
      socialActions.FOLLOW_USER_SUCCEEDED,
      socialActions.FOLLOW_USER_FAILED
    ])
    const userIdx = userIds.findIndex(uid => uid === action.userId)
    if (userIdx !== -1) usersConfirmed[userIdx] = true
  }
}

function* confirmFollowsAndRefresh(userIds) {
  yield call(waitForFollow, userIds)
  yield put(feedActions.refreshInView(true))
}

function* followUsers(action) {
  yield call(waitForBackendSetup)
  try {
    yield put(feedActions.setLoading(true))
    yield fork(confirmFollowsAndRefresh, action.userIds)
    for (const userId of action.userIds) {
      yield put(socialActions.followUser(userId))
    }
  } catch (err) {
    console.error(err.message)
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
