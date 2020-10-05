import { delay } from 'redux-saga'
import {
  call,
  fork,
  all,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'
import { pick, some } from 'lodash'

import * as profileActions from './actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as cacheActions from 'store/cache/actions'
import { Kind } from 'store/types'
import * as confirmerActions from 'store/confirmer/actions'
import AudiusBackend from 'services/AudiusBackend'
import { pollUser } from 'store/confirmer/sagas'
import { getUserId } from 'store/account/selectors'
import {
  getProfileUserId,
  getProfileFollowers,
  getProfileUser
} from './selectors'
import { makeUid, makeKindId } from 'utils/uid'

import {
  fetchUsers,
  fetchUserByHandle,
  fetchUserCollections
} from 'store/cache/users/sagas'
import { FollowType } from './types'

import feedSagas from 'containers/profile-page/store/lineups/feed/sagas.js'
import tracksSagas from 'containers/profile-page/store/lineups/tracks/sagas.js'
import { DefaultSizes } from 'models/common/ImageSizes'
import { squashNewLines } from 'utils/formatUtil'
import { getIsReachable } from 'store/reachability/selectors'
import { isMobile } from 'utils/clientUtil'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { processAndCacheUsers } from 'store/cache/users/utils'

function* watchFetchProfile() {
  yield takeLatest(profileActions.FETCH_PROFILE, fetchProfileAsync)
}

function* fetchProfileAsync(action) {
  try {
    let user
    if (action.handle) {
      user = yield call(
        fetchUserByHandle,
        action.handle,
        new Set(),
        action.forceUpdate,
        action.shouldSetLoading,
        action.deleteExistingEntry
      )
    } else if (action.userId) {
      const users = yield call(
        fetchUsers,
        [action.userId],
        new Set(),
        action.forceUpdate,
        action.shouldSetLoading
      )
      user = users.entries[action.userId]
    }
    if (!user) {
      const isReachable = yield select(getIsReachable)
      if (isReachable) {
        yield put(profileActions.fetchProfileFailed())
      }
      return
    }
    yield put(profileActions.fetchProfileSucceeded(user.handle, user.user_id))
    yield fork(fetchUserCollections, user.user_id)
    const isSubscribed = yield call(
      AudiusBackend.getUserSubscribed,
      user.user_id
    )
    yield put(
      profileActions.setNotificationSubscription(user.user_id, isSubscribed)
    )

    const isMobileClient = isMobile()
    if (!isMobileClient) {
      if (user.is_creator && user.track_count > 0) {
        yield fork(fetchMostUsedTags, user.user_id, user.track_count)
      }
    }

    // Delay so the page can load before we fetch followers/followees
    yield delay(2000)

    const followsToFetch = [
      put(profileActions.fetchFollowUsers(FollowType.FOLLOWERS)),
      put(profileActions.fetchFollowUsers(FollowType.FOLLOWEES))
    ]
    if (!isMobileClient) {
      followsToFetch.push(
        put(profileActions.fetchFollowUsers(FollowType.FOLLOWEE_FOLLOWS))
      )
    }

    yield all(followsToFetch)
  } catch (err) {
    const isReachable = yield select(getIsReachable)
    if (!isReachable) return
    throw err
  }
}

function* watchFetchFollowUsers(action) {
  yield takeEvery(profileActions.FETCH_FOLLOW_USERS, function* (action) {
    yield call(waitForBackendSetup)
    switch (action.followerGroup) {
      case FollowType.FOLLOWERS:
        yield call(fetchFollowerUsers, action)
        break
      case FollowType.FOLLOWEES:
        yield call(fetchFollowees, action)
        break
      case FollowType.FOLLOWEE_FOLLOWS:
        yield call(fetchFolloweeFollows, action)
        break
      default:
    }
  })
}

const MOST_USED_TAGS_COUNT = 5

// Get all the tracks & parse the tracks for the most used tags
// NOTE: The number of user tracks is not known b/c some tracks are deleted,
// so the number of user tracks plus a large track number are fetched
const LARGE_TRACKCOUNT_TAGS = 100
function* fetchMostUsedTags(userId, trackCount) {
  const trackResponse = yield call(AudiusBackend.getArtistTracks, {
    offset: 0,
    limit: trackCount + LARGE_TRACKCOUNT_TAGS,
    userId: userId,
    filterDeleted: true
  })
  const tracks = trackResponse.filter(metadata => !metadata.is_delete)
  // tagUsage: { [tag: string]: number }
  const tagUsage = {}
  tracks.forEach(track => {
    if (track.tags) {
      track.tags.split(',').forEach(tag => {
        tag in tagUsage ? (tagUsage[tag] += 1) : (tagUsage[tag] = 1)
      })
    }
  })
  const mostUsedTags = Object.keys(tagUsage)
    .sort((a, b) => tagUsage[b] - tagUsage[a])
    .slice(0, MOST_USED_TAGS_COUNT)
  yield put(profileActions.updateMostUsedTags(mostUsedTags))
}

function* fetchFollowerUsers(action) {
  const profileUserId = yield select(getProfileUserId)
  if (!profileUserId) return
  const currentUserId = yield select(getUserId)
  const followers = yield apiClient.getFollowers({
    currentUserId,
    profileUserId,
    limit: action.limit,
    offset: action.offset
  })

  const followerIds = yield call(followAndCacheUsers, followers)
  yield put(
    profileActions.fetchFollowUsersSucceeded(
      FollowType.FOLLOWERS,
      followerIds,
      action.limit,
      action.offset
    )
  )
}

function* fetchFollowees(action) {
  const profileUserId = yield select(getProfileUserId)
  if (!profileUserId) return
  const currentUserId = yield select(getUserId)
  const followees = yield apiClient.getFollowing({
    currentUserId,
    profileUserId,
    limit: action.limit,
    offset: action.offset
  })

  const followerIds = yield call(followAndCacheUsers, followees)
  yield put(
    profileActions.fetchFollowUsersSucceeded(
      FollowType.FOLLOWEES,
      followerIds,
      action.limit,
      action.offset
    )
  )
}

function* fetchFolloweeFollows(action) {
  const profileUserId = yield select(getProfileUserId)
  if (!profileUserId) return
  const followeeFollows = yield call(
    AudiusBackend.getFolloweeFollows,
    profileUserId,
    action.limit,
    action.offset
  )
  const followerIds = yield call(followAndCacheUsers, followeeFollows)
  yield put(
    profileActions.fetchFollowUsersSucceeded(
      FollowType.FOLLOWEE_FOLLOWS,
      followerIds,
      action.limit,
      action.offset
    )
  )
}

function* followAndCacheUsers(followers) {
  const users = yield processAndCacheUsers(followers)
  return users.map(f => ({ id: f.user_id }))
}

function* watchUpdateProfile() {
  yield takeEvery(profileActions.UPDATE_PROFILE, updateProfileAsync)
}

function* updateProfileAsync(action) {
  yield call(waitForBackendSetup)
  action.metadata.bio = squashNewLines(action.metadata.bio)

  const accountUserId = yield select(getUserId)
  yield put(
    cacheActions.update(Kind.USERS, [
      { id: accountUserId, metadata: { name: action.metadata.name } }
    ])
  )
  yield call(confirmUpdateProfile, action.metadata.user_id, action.metadata)

  const creator = action.metadata
  if (action.metadata.updatedCoverPhoto) {
    action.metadata._cover_photo_sizes[DefaultSizes.OVERRIDE] =
      action.metadata.updatedCoverPhoto.url
  }
  if (creator.updatedProfilePicture) {
    action.metadata._profile_picture_sizes[DefaultSizes.OVERRIDE] =
      action.metadata.updatedProfilePicture.url
  }

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: creator.user_id,
        metadata: action.metadata
      }
    ])
  )
  yield put(profileActions.updateProfileSucceeded(action.metadata.user_id))
}

function* confirmUpdateProfile(userId, metadata) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.USERS, userId),
      function* () {
        if (metadata.is_creator) {
          yield call(AudiusBackend.updateCreator, metadata, userId)
        } else {
          yield call(AudiusBackend.updateUser, metadata, userId)
        }
        const toConfirm = pick(metadata, ['name', 'bio', 'location'])
        // If the user is trying to upload a new profile picture or cover photo, check that it gets changed
        let coverPhotoCheck = user => user
        let profilePictureCheck = user => user
        if (metadata.updatedCoverPhoto) {
          coverPhotoCheck = user =>
            user.cover_photo_sizes !== metadata.cover_photo_sizes
        }
        if (metadata.updatedProfilePicture) {
          profilePictureCheck = user =>
            user.profile_picture_sizes !== metadata.profile_picture_sizes
        }
        const checks = user =>
          some([user], toConfirm) &&
          coverPhotoCheck(user) &&
          profilePictureCheck(user)
        return yield call(pollUser, userId, checks)
      },
      function* () {},
      function* () {
        yield put(profileActions.updateProfileFailed())
      }
    )
  )
}

function* watchUpdateCurrentUserFollows() {
  yield takeEvery(
    profileActions.UPDATE_CURRENT_USER_FOLLOWS,
    updateCurrentUserFollows
  )
}

function* updateCurrentUserFollows(action) {
  const userId = yield select(getUserId)
  const { userIds, status } = yield select(getProfileFollowers)
  let updatedUserIds = userIds
  if (action.follow) {
    const uid = makeUid(Kind.USERS, userId)
    const profileUser = yield select(getProfileUser)
    if (profileUser.follower_count - 1 === userIds.length) {
      updatedUserIds = userIds.concat({ id: userId, uid })
    }
  } else {
    updatedUserIds = userIds.filter(f => f.id !== userId)
  }
  yield put(
    profileActions.setProfileField(FollowType.FOLLOWERS, {
      status,
      userIds: updatedUserIds
    })
  )
}

function* watchSetNotificationSubscription() {
  yield takeEvery(profileActions.SET_NOTIFICATION_SUBSCRIPTION, function* (
    action
  ) {
    if (action.update) {
      try {
        yield call(
          AudiusBackend.updateUserSubscription,
          action.userId,
          action.isSubscribed
        )
      } catch (err) {
        const isReachable = yield select(getIsReachable)
        if (!isReachable) return
        throw err
      }
    }
  })
}

export default function sagas() {
  return [
    ...feedSagas(),
    ...tracksSagas(),
    watchFetchFollowUsers,
    watchFetchProfile,
    watchUpdateProfile,
    watchUpdateCurrentUserFollows,
    watchSetNotificationSubscription
  ]
}
