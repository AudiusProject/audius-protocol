import {
  userMetadataListFromSDK,
  userWalletsFromSDK
} from '@audius/common/adapters'
import {
  getUserQueryKey,
  queryCurrentUserId,
  queryUser,
  queryUserByHandle
} from '@audius/common/api'
import { Kind } from '@audius/common/models'
import {
  profilePageActions as profileActions,
  chatActions,
  reachabilitySelectors,
  collectiblesActions,
  confirmerActions,
  confirmTransaction,
  getSDK
} from '@audius/common/store'
import {
  squashNewLines,
  makeKindId,
  waitForAccount,
  dataURLtoFile,
  isResponseError,
  route
} from '@audius/common/utils'
import { Id } from '@audius/sdk'
import {
  all,
  call,
  fork,
  getContext,
  put,
  select,
  takeEvery
} from 'redux-saga/effects'

import feedSagas from 'common/store/pages/profile/lineups/feed/sagas.js'
import tracksSagas from 'common/store/pages/profile/lineups/tracks/sagas.js'
import { push as pushRoute } from 'utils/navigation'
import { waitForWrite } from 'utils/sagaHelpers'

const { NOT_FOUND_PAGE } = route
const { getIsReachable } = reachabilitySelectors

const {
  updateUserEthCollectibles,
  updateUserSolCollectibles,
  updateSolCollections,
  setHasUnsupportedCollection
} = collectiblesActions

const { fetchPermissions } = chatActions

function* watchFetchProfile() {
  yield takeEvery(profileActions.FETCH_PROFILE, fetchProfileAsync)
}

export function* fetchEthereumCollectiblesForWallets(wallets) {
  const nftClient = yield getContext('nftClient')
  return yield call([nftClient, nftClient.getEthereumCollectibles], wallets)
}

function* fetchEthereumCollectiblesWithCollections(collectibles) {
  const nftClient = yield getContext('nftClient')
  return yield call(
    [nftClient, nftClient.getEthereumCollectionMetadatasForCollectibles],
    collectibles
  )
}

export function* fetchEthereumCollectibles(user) {
  const queryClient = yield getContext('queryClient')
  const sdk = yield* getSDK()
  const { data } = yield call([sdk.users, sdk.users.getConnectedWallets], {
    id: Id.parse(user.user_id)
  })
  const associatedWallets = data ? userWalletsFromSDK(data) : null

  if (!associatedWallets) {
    console.debug('No associated wallets found')
    return
  }

  const { wallets } = associatedWallets
  const collectiblesMap = yield call(fetchEthereumCollectiblesForWallets, [
    user.wallet,
    ...wallets
  ])

  const collectibleList = Object.values(collectiblesMap).flat()
  if (!collectibleList.length) {
    console.info('profile has no assets in OpenSea')
  }

  queryClient.setQueryData(getUserQueryKey(user.user_id), (prevUser) =>
    !prevUser
      ? undefined
      : {
          ...prevUser,
          collectibleList
        }
  )
  yield put(
    updateUserEthCollectibles({
      userId: user.user_id,
      userCollectibles: collectibleList
    })
  )

  // Fetch collections and update state
  const collectiblesWithCollections = yield call(
    fetchEthereumCollectiblesWithCollections,
    collectibleList
  )
  queryClient.setQueryData(getUserQueryKey(user.user_id), (prevUser) =>
    !prevUser
      ? undefined
      : {
          ...prevUser,
          collectibleList: collectiblesWithCollections
        }
  )
  yield put(
    updateUserEthCollectibles({
      userId: user.user_id,
      userCollectibles: collectiblesWithCollections
    })
  )
}

export function* fetchSolanaCollectiblesForWallets(wallets) {
  const { waitForRemoteConfig } = yield getContext('remoteConfigInstance')
  const nftClient = yield getContext('nftClient')
  yield call(waitForRemoteConfig)
  return yield call([nftClient, nftClient.getSolanaCollectibles], wallets)
}

export function* fetchSolanaCollectibles(user) {
  const sdk = yield* getSDK()
  const queryClient = yield getContext('queryClient')
  const nftClient = yield getContext('nftClient')
  const { waitForRemoteConfig } = yield getContext('remoteConfigInstance')
  yield call(waitForRemoteConfig)
  const { data } = yield call([sdk.users, sdk.users.getConnectedWallets], {
    id: Id.parse(user.user_id)
  })
  const associatedWallets = data ? userWalletsFromSDK(data) : null
  if (!associatedWallets) {
    console.debug('No associated wallets found')
    return
  }

  const { sol_wallets: solWallets } = associatedWallets
  const collectiblesMap = yield call(
    fetchSolanaCollectiblesForWallets,
    solWallets
  )

  const solanaCollectibleList = Object.values(collectiblesMap).flat()
  if (!solanaCollectibleList.length) {
    console.info('profile has no Solana NFTs')
  }

  queryClient.setQueryData(getUserQueryKey(user.user_id), (prevUser) =>
    !prevUser
      ? undefined
      : {
          ...prevUser,
          solanaCollectibleList
        }
  )
  yield put(
    updateUserSolCollectibles({
      userId: user.user_id,
      userCollectibles: solanaCollectibleList
    })
  )

  const heliusCollectionMetadatasMap = solanaCollectibleList.reduce(
    (result, collectible) => {
      const collection = collectible.heliusCollection
      if (collection && !result[collection.address]) {
        result[collection.address] = {
          data: collection,
          imageUrl: collection.imageUrl
        }
      }
      return result
    },
    {}
  )

  // Get verified sol collections from the sol collectibles without helius collections
  // and save their metadata in the redux store.
  // Also keep track of whether the user has unsupported
  // sol collections, which is the case if one of the following is true:
  // - there is a sol nft which has no helius collection and no verified collection chain metadata
  // - there a verified sol nft collection for which we could not fetch the metadata (this is an edge case e.g. we cannot fetch the metadata this collection mint address B3LDTPm6qoQmSEgar2FHUHLt6KEHEGu9eSGejoMMv5eb)
  let hasUnsupportedCollection = false
  const collectiblesWithoutHeliusCollections = solanaCollectibleList.filter(
    (collectible) => !collectible.heliusCollection
  )
  const validNonHeliusCollectionMints = [
    ...new Set(
      collectiblesWithoutHeliusCollections
        .filter((collectible) => {
          const isFromVerifiedCollection =
            !!collectible.solanaChainMetadata?.collection?.verified
          if (!hasUnsupportedCollection && !isFromVerifiedCollection) {
            hasUnsupportedCollection = true
          }
          return isFromVerifiedCollection
        })
        .map((collectible) => {
          const key = collectible.solanaChainMetadata.collection.key
          return typeof key === 'string' ? key : key.toBase58()
        })
    )
  ]
  const nonHeliusCollectionMetadatas = yield all(
    validNonHeliusCollectionMints.map((mint) =>
      call([nftClient, nftClient.getSolanaMetadataFromChain], mint)
    )
  )
  const nonHeliusCollectionMetadatasMap = {}
  nonHeliusCollectionMetadatas.forEach((cm, i) => {
    if (!cm) {
      if (!hasUnsupportedCollection) {
        hasUnsupportedCollection = true
      }
      return
    }
    const { metadata, imageUrl } = cm
    nonHeliusCollectionMetadatasMap[validNonHeliusCollectionMints[i]] = {
      ...metadata.pretty(),
      imageUrl
    }
  })
  yield put(
    updateSolCollections({
      metadatas: {
        ...heliusCollectionMetadatasMap,
        ...nonHeliusCollectionMetadatasMap
      }
    })
  )
  if (hasUnsupportedCollection) {
    yield put(setHasUnsupportedCollection(true))
  }
}

function* fetchProfileAsync(action) {
  try {
    let user
    const queryOptions = action.forceUpdate
      ? { force: true, staleTime: 0 }
      : undefined

    if (action.userId) {
      user = yield call(queryUser, action.userId, queryOptions)
    } else if (action.handle) {
      user = yield call(
        queryUserByHandle,
        action.handle?.replace('/', ''),
        queryOptions
      )
    }
    if (!user) {
      const isReachable = yield select(getIsReachable)
      if (isReachable) {
        yield put(profileActions.fetchProfileFailed())
        yield put(pushRoute(NOT_FOUND_PAGE))
      }
      return
    }
    yield put(
      profileActions.fetchProfileSucceeded(
        user.handle,
        user.user_id,
        action.fetchOnly
      )
    )

    // Get chat permissions
    yield put(fetchPermissions({ userIds: [user.user_id] }))

    yield fork(fetchEthereumCollectibles, user)
    yield fork(fetchSolanaCollectibles, user)
  } catch (err) {
    console.error(`Fetch users error: ${err}`)
    const isReachable = yield select(getIsReachable)
    if (isReachable && isResponseError(err) && err.response.status === 404) {
      yield put(pushRoute(NOT_FOUND_PAGE))
      return
    }
    if (!isReachable) return
    throw err
  }
}

function* watchUpdateProfile() {
  yield takeEvery(profileActions.UPDATE_PROFILE, updateProfileAsync)
}

export function* updateProfileAsync(action) {
  yield waitForWrite()
  const queryClient = yield getContext('queryClient')
  const metadata = { ...action.metadata }
  metadata.bio = squashNewLines(metadata.bio)

  const accountUserId = yield call(queryCurrentUserId)

  queryClient.setQueryData(getUserQueryKey(accountUserId), (prevUser) =>
    !prevUser
      ? undefined
      : {
          ...prevUser,
          name: metadata.name
        }
  )

  // For base64 images (coming from native), convert to a blob
  if (metadata.updatedCoverPhoto?.type === 'base64') {
    metadata.updatedCoverPhoto.file = dataURLtoFile(
      metadata.updatedCoverPhoto.file
    )
  }

  if (metadata.updatedProfilePicture?.type === 'base64') {
    metadata.updatedProfilePicture.file = dataURLtoFile(
      metadata.updatedProfilePicture.file
    )
  }

  yield call(confirmUpdateProfile, metadata.user_id, metadata)

  queryClient.setQueryData(getUserQueryKey(metadata.user_id), (prevUser) =>
    !prevUser
      ? undefined
      : {
          ...prevUser,
          ...metadata
        }
  )
}

function* confirmUpdateProfile(userId, metadata) {
  yield waitForWrite()
  const sdk = yield* getSDK()
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const queryClient = yield getContext('queryClient')
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.USERS, userId),
      function* () {
        const response = yield call(audiusBackendInstance.updateCreator, {
          metadata,
          sdk
        })
        const { blockHash, blockNumber } = response

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm update profile for user id ${userId}`
          )
        }
        yield waitForAccount()
        const currentUserId = yield call(queryCurrentUserId)
        const { data = [] } = yield call(
          [sdk.full.users, sdk.full.users.getUser],
          {
            id: Id.parse(userId),
            userId: Id.parse(currentUserId)
          }
        )
        return userMetadataListFromSDK(data)[0]
      },
      function* (confirmedUser) {
        // Update the cached user so it no longer contains image upload artifacts
        // and contains updated profile picture / cover photo sizes if any
        const newMetadata = {}
        if (metadata.updatedCoverPhoto) {
          newMetadata.cover_photo_sizes = confirmedUser.cover_photo_sizes
          newMetadata.cover_photo_cids = confirmedUser.cover_photo_cids
          newMetadata.cover_photo = confirmedUser.cover_photo
        }
        if (metadata.updatedProfilePicture) {
          newMetadata.profile_picture_sizes =
            confirmedUser.profile_picture_sizes
          newMetadata.profile_picture_cids = confirmedUser.profile_picture_cids
          newMetadata.profile_picture = confirmedUser.profile_picture
        }
        queryClient.setQueryData(
          getUserQueryKey(confirmedUser.user_id),
          (prevUser) =>
            !prevUser
              ? undefined
              : {
                  ...prevUser,
                  ...newMetadata
                }
        )
        yield put(profileActions.updateProfileSucceeded(metadata.user_id))
      },
      function* () {
        yield put(profileActions.updateProfileFailed())
      },
      undefined,
      undefined,
      { operationId: 'OVERWRITE', squashable: true }
    )
  )
}

export default function sagas() {
  return [
    ...feedSagas(),
    ...tracksSagas(),
    watchFetchProfile,
    watchUpdateProfile
  ]
}
