import { ID } from '@audius/common'
import { call, put, take, fork, takeEvery } from 'redux-saga/effects'

import { FollowSource } from 'common/models/Analytics'
import { fetchUsers } from 'common/store/cache/users/sagas'
import * as discoverActions from 'common/store/pages/feed/actions'
import { feedActions } from 'common/store/pages/feed/lineup/actions'
import * as socialActions from 'common/store/social/users/actions'
import { fetchSuggestedFollowUserIds } from 'pages/sign-on/store/sagas'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getErrorMessage } from 'utils/error'

import feedSagas from './lineups/feed/sagas'

function* fetchSuggestedFollowUsers() {
  yield call(waitForBackendSetup)
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
  yield call(waitForBackendSetup)
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
