import { merge } from 'lodash'
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

import { DefaultSizes } from 'common/models/ImageSizes'
import Kind from 'common/models/Kind'
import { getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import {
  fetchUsers,
  fetchUserByHandle,
  fetchUserCollections
} from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import { squashNewLines } from 'common/utils/formatUtil'
import { makeUid, makeKindId } from 'common/utils/uid'
import * as artistRecommendationsActions from 'containers/artist-recommendations/store/slice'
import feedSagas from 'containers/profile-page/store/lineups/feed/sagas.js'
import tracksSagas from 'containers/profile-page/store/lineups/tracks/sagas.js'
import AudiusBackend, { fetchCID } from 'services/AudiusBackend'
import { setAudiusAccountUser } from 'services/LocalStorage'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import OpenSeaClient from 'services/opensea-client/OpenSeaClient'
import { DoubleKeys, FeatureFlags } from 'services/remote-config'
import {
  getRemoteVar,
  getFeatureEnabled,
  waitForRemoteConfig
} from 'services/remote-config/Provider'
import SolanaClient from 'services/solana-client/SolanaClient'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { getIsReachable } from 'store/reachability/selectors'
import { isMobile } from 'utils/clientUtil'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { waitForValue } from 'utils/sagaHelpers'

import * as profileActions from './actions'
import {
  getProfileUserId,
  getProfileFollowers,
  getProfileUser
} from './selectors'
import { FollowType } from './types'

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

export function* fetchOpenSeaAssetsForWallets(wallets) {
  return yield call(OpenSeaClient.getAllCollectibles, wallets)
}

export function* fetchOpenSeaAssets(user) {
  const { wallets } = yield apiClient.getAssociatedWallets({
    userID: user.user_id
  })
  const collectiblesMap = yield call(fetchOpenSeaAssetsForWallets, [
    user.wallet,
    ...wallets
  ])

  const collectibleList = Object.values(collectiblesMap).flat()
  if (!collectibleList.length) {
    console.log('profile has no assets in OpenSea')
  }

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: { collectibleList }
      }
    ])
  )
}

export function* fetchSolanaCollectiblesForWallets(wallets) {
  yield call(waitForRemoteConfig)

  if (!getFeatureEnabled(FeatureFlags.SOLANA_COLLECTIBLES_ENABLED)) {
    return {}
  }

  return yield call(SolanaClient.getAllCollectibles, wallets)
}

export function* fetchSolanaCollectibles(user) {
  yield call(waitForRemoteConfig)

  if (!getFeatureEnabled(FeatureFlags.SOLANA_COLLECTIBLES_ENABLED)) {
    return
  }

  const { sol_wallets: solWallets } = yield apiClient.getAssociatedWallets({
    userID: user.user_id
  })
  const collectiblesMap = yield call(
    fetchSolanaCollectiblesForWallets,
    solWallets
  )

  const solanaCollectibleList = Object.values(collectiblesMap).flat()
  if (!solanaCollectibleList.length) {
    console.log('profile has no Solana NFTs')
  }

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: { solanaCollectibleList }
      }
    ])
  )
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
    yield fork(fetchSolanaCollectibles, user)

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

    const showArtistRecommendationsPercent =
      getRemoteVar(DoubleKeys.SHOW_ARTIST_RECOMMENDATIONS_PERCENT) || 0
    if (Math.random() < showArtistRecommendationsPercent) {
      yield put(
        artistRecommendationsActions.fetchRelatedArtists({
          userId: user.user_id
        })
      )
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
          tiktok_handle: socials.tikTokHandle || null,
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

  const followerIds = yield call(cacheUsers, followers)
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

  const followerIds = yield call(cacheUsers, followees)
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

  const followerIds = yield call(cacheUsers, followeeFollows)
  yield put(
    profileActions.fetchFollowUsersSucceeded(
      FollowType.FOLLOWEE_FOLLOWS,
      followerIds,
      action.limit,
      action.offset
    )
  )
}

function* cacheUsers(users) {
  const currentUserId = yield select(getUserId)
  // Filter out the current user from the list to cache
  yield processAndCacheUsers(
    users.filter(user => user.user_id !== currentUserId)
  )
  return users.map(f => ({ id: f.user_id }))
}

function* watchUpdateProfile() {
  yield takeEvery(profileActions.UPDATE_PROFILE, updateProfileAsync)
}

export function* updateProfileAsync(action) {
  yield call(waitForBackendSetup)
  let metadata = { ...action.metadata }
  metadata.bio = squashNewLines(metadata.bio)

  const accountUserId = yield select(getUserId)
  yield put(
    cacheActions.update(Kind.USERS, [
      { id: accountUserId, metadata: { name: metadata.name } }
    ])
  )

  // Get existing metadata and combine with it
  const gateways = getCreatorNodeIPFSGateways(metadata.creator_node_endpoint)
  const cid = metadata.metadata_multihash ?? null
  if (cid) {
    try {
      const metadataFromIPFS = yield call(
        fetchCID,
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
      const collectibles = metadata.collectibles
      metadata = merge(metadataFromIPFS, metadata)
      metadata.collectibles = collectibles
    } catch (e) {
      // Although we failed to fetch the existing user metadata, this should only
      // happen if the user's account data is unavailable across the whole network.
      // In favor of availability, we write anyway.
      console.error(e)
    }
  }

  yield call(confirmUpdateProfile, metadata.user_id, metadata)

  const creator = metadata
  if (metadata.updatedCoverPhoto) {
    metadata._cover_photo_sizes[DefaultSizes.OVERRIDE] =
      metadata.updatedCoverPhoto.url
  }
  if (creator.updatedProfilePicture) {
    metadata._profile_picture_sizes[DefaultSizes.OVERRIDE] =
      metadata.updatedProfilePicture.url
  }

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: creator.user_id,
        metadata: metadata
      }
    ])
  )
  yield put(profileActions.updateProfileSucceeded(metadata.user_id))
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
