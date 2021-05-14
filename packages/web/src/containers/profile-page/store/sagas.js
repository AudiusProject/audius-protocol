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

import * as profileActions from './actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as cacheActions from 'store/cache/actions'
import { Kind } from 'store/types'
import * as confirmerActions from 'store/confirmer/actions'
import AudiusBackend, { fetchCID } from 'services/AudiusBackend'
import { confirmTransaction } from 'store/confirmer/sagas'
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
import { getUser } from 'store/cache/users/selectors'
import { waitForValue } from 'utils/sagaHelpers'
import { setAudiusAccountUser } from 'services/LocalStorage'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import OpenSeaClient from 'services/opensea-client/OpenSeaClient'

function* watchFetchProfile() {
  yield takeLatest(profileActions.FETCH_PROFILE, fetchProfileAsync)
}

function* fetchProfileCustomizedCollectibles(user) {
  const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
  const cid = user?.metadata_multihash ?? null
  if (cid) {
    const metadata = yield call(
      fetchCID,
      cid,
      gateways,
      /* cache */ false,
      /* asUrl */ false
    )
    if (metadata?.collectibles) {
      yield put(
        cacheActions.update(Kind.USERS, [
          {
            id: user.user_id,
            metadata
          }
        ])
      )
    } else {
      console.log('something went wrong, could not get user collectibles order')
    }
  }
}

function* fetchOpenSeaAssets(user) {
  const associatedWallets = yield apiClient.getAssociatedWallets({
    userID: user.user_id
  })
  const collectibleList = yield call(OpenSeaClient.getAllCollectibles, [
    user.wallet,
    ...associatedWallets.wallets
  ])
  if (collectibleList) {
    if (collectibleList.length) {
      yield put(
        cacheActions.update(Kind.USERS, [
          {
            id: user.user_id,
            metadata: { collectibleList }
          }
        ])
      )
    } else {
      console.log('profile has no assets in OpenSea')
    }
  } else {
    console.log('could not fetch OpenSea assets')
  }
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

    // Fetch user socials and collections after fetching the user itself
    yield fork(fetchUserSocials, action.handle)
    yield fork(fetchUserCollections, user.user_id)
    yield fork(fetchProfileCustomizedCollectibles, user)
    yield fork(fetchOpenSeaAssets, user)

    // Get current user notification & subscription status
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

function* fetchUserSocials(handle) {
  const user = yield call(waitForValue, getUser, { handle })
  const socials = yield call(AudiusBackend.getCreatorSocialHandle, user.handle)
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          twitter_handle: socials.twitterHandle || null,
          instagram_handle: socials.instagramHandle || null,
          website: socials.website || null,
          donation: socials.donation || null,
          _artist_pick: socials.pinnedTrackId || null
        }
      }
    ])
  )
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
        let response
        if (metadata.creator_node_endpoint) {
          response = yield call(AudiusBackend.updateCreator, metadata, userId)
        } else {
          response = yield call(AudiusBackend.updateUser, metadata, userId)
        }
        const { blockHash, blockNumber } = response

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm update profile for user id ${userId}`
          )
        }
        const currentUserId = yield select(getUserId)
        const users = yield apiClient.getUser({
          userId,
          currentUserId
        })
        return users[0]
      },
      function* (confirmedUser) {
        // Store the update in local storage so it is correct upon reload
        yield setAudiusAccountUser(confirmedUser)
        // Update the cached user so it no longer contains image upload artifacts
        // and contains updated profile picture / cover photo sizes if any
        const newMetadata = {
          updatedProfilePicture: null,
          updatedCoverPhoto: null
        }
        if (metadata.updatedCoverPhoto) {
          newMetadata.cover_photo_sizes = confirmedUser.cover_photo_sizes
        }
        if (metadata.updatedProfilePicture) {
          newMetadata.profile_picture_sizes =
            confirmedUser.profile_picture_sizes
        }
        yield put(
          cacheActions.update(Kind.USERS, [
            {
              id: confirmedUser.user_id,
              metadata: newMetadata
            }
          ])
        )
      },
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
