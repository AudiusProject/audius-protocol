import { PayloadAction } from '@reduxjs/toolkit'
import { shuffle } from 'lodash'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { ID, UserMetadata } from '~/models'
import { DoubleKeys } from '~/services/remote-config'
import { accountSelectors } from '~/store/account'
import { processAndCacheUsers } from '~/store/cache'
import { getContext } from '~/store/effects'
import { waitForRead } from '~/utils/sagaHelpers'
import { removeNullable } from '~/utils/typeUtils'

import { actions as relatedArtistsActions } from './slice'

const getUserId = accountSelectors.getUserId

export function* fetchRelatedArtists(action: PayloadAction<{ artistId: ID }>) {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  if (relatedArtistsActions.fetchRelatedArtists.match(action)) {
    const artistId = action.payload.artistId

    const relatedArtists = yield* call(
      [apiClient, apiClient.getRelatedArtists],
      {
        userId: artistId,
        limit: 50
      }
    )

    let showingTopArtists = false
    const filteredArtists = relatedArtists.filter(
      (user) => !user.is_deactivated
    )
    let suggestedFollows = relatedArtists
      .filter((user) => !user.does_current_user_follow)
      .slice(0, 5)
    if (suggestedFollows.length === 0) {
      const showTopArtistRecommendationsPercent =
        remoteConfigInstance.getRemoteVar(
          DoubleKeys.SHOW_ARTIST_RECOMMENDATIONS_FALLBACK_PERCENT
        ) || 0
      const showTopArtists = Math.random() < showTopArtistRecommendationsPercent

      if (showTopArtists) {
        suggestedFollows = yield* call(fetchTopArtists)
        showingTopArtists = true
      }
    }
    if (filteredArtists.length > 0 || suggestedFollows.length > 0) {
      const relatedArtistIds = yield* cacheUsers(filteredArtists)
      const suggestedFollowIds = yield* cacheUsers(suggestedFollows)
      yield* put(
        relatedArtistsActions.fetchRelatedArtistsSucceeded({
          artistId,
          relatedArtistIds,
          suggestedFollowIds,
          isTopArtistsRecommendation: showingTopArtists
        })
      )
    }
  }
}

function* fetchTopArtists() {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const currentUserId = yield* select(getUserId)
  const topArtists = yield* call([apiClient, apiClient.getTopArtists], {
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

function* cacheUsers(users: UserMetadata[]) {
  yield* waitForRead()
  const currentUserId = yield* select(getUserId)
  // Filter out the current user from the list to cache
  yield processAndCacheUsers(
    users.filter((user) => user.user_id !== currentUserId)
  )
  return users.map((f) => f.user_id).filter(removeNullable)
}

function* watchFetchRelatedArtists() {
  yield* takeEvery(
    relatedArtistsActions.fetchRelatedArtists,
    fetchRelatedArtists
  )
}

export default function sagas() {
  return [watchFetchRelatedArtists]
}
