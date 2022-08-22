import {
  ID,
  User,
  DoubleKeys,
  accountSelectors,
  getContext,
  artistRecommendationsUIActions as artistRecommendationsActions
} from '@audius/common'
import { Action } from '@reduxjs/toolkit'
import { shuffle } from 'lodash'
import { call, put, select, takeEvery } from 'redux-saga/effects'

import { processAndCacheUsers } from 'common/store/cache/users/utils'
import { waitForAccount } from 'utils/sagaHelpers'

const getUserId = accountSelectors.getUserId

export function* fetchRelatedArtists(action: Action) {
  const apiClient = yield* getContext('apiClient')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  if (artistRecommendationsActions.fetchRelatedArtists.match(action)) {
    const userId = action.payload.userId
    yield* waitForAccount()
    const currentUserId: ID = yield select(getUserId)
    const relatedArtists: User[] = yield apiClient.getRelatedArtists({
      userId,
      currentUserId,
      limit: 50
    })

    let filteredArtists = relatedArtists
      .filter((user) => !user.does_current_user_follow && !user.is_deactivated)
      .slice(0, 5)
    if (filteredArtists.length === 0) {
      const showTopArtistRecommendationsPercent =
        remoteConfigInstance.getRemoteVar(
          DoubleKeys.SHOW_ARTIST_RECOMMENDATIONS_FALLBACK_PERCENT
        ) || 0
      const showTopArtists = Math.random() < showTopArtistRecommendationsPercent
      if (showTopArtists) {
        filteredArtists = yield fetchTopArtists()
      }
    }
    if (filteredArtists.length > 0) {
      const relatedArtistIds: ID[] = yield call(cacheUsers, filteredArtists)
      yield put(
        artistRecommendationsActions.fetchRelatedArtistsSucceeded({
          userId,
          relatedArtistIds
        })
      )
    }
  }
}

function* fetchTopArtists() {
  const apiClient = yield* getContext('apiClient')
  yield* waitForAccount()
  const currentUserId: ID = yield select(getUserId)
  const topArtists: User[] = yield apiClient.getTopArtists({
    currentUserId,
    limit: 50
  })
  const filteredArtists = topArtists.filter(
    (user) => !user.does_current_user_follow && !user.is_deactivated
  )
  if (filteredArtists.length > 0) {
    // Pick 5 at random
    const selectedArtists = shuffle(filteredArtists).slice(0, 5)
    return selectedArtists
  }
  return []
}

function* cacheUsers(users: User[]) {
  yield* waitForAccount()
  const currentUserId: ID = yield select(getUserId)
  // Filter out the current user from the list to cache
  yield processAndCacheUsers(
    users.filter((user) => user.user_id !== currentUserId)
  )
  return users.map((f) => f.user_id)
}

function* watchFetchRelatedArtists() {
  yield takeEvery(
    artistRecommendationsActions.fetchRelatedArtists,
    fetchRelatedArtists
  )
}

export default function sagas() {
  return [watchFetchRelatedArtists]
}
