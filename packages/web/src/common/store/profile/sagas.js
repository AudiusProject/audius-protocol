import { userWalletsFromSDK } from '@audius/common/adapters'
import { Kind } from '@audius/common/models'
import {
  cacheActions,
  profilePageActions as profileActions,
  chatActions,
  reachabilitySelectors,
  collectiblesActions,
  getSDK,
  cacheUsersSelectors
} from '@audius/common/store'
import { isResponseError, route } from '@audius/common/utils'
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
import {
  subscribeToUserAsync,
  unsubscribeFromUserAsync
} from 'common/store/social/users/sagas'
import { push as pushRoute } from 'utils/navigation'

const { NOT_FOUND_PAGE } = route
const { getIsReachable } = reachabilitySelectors

const { getUser } = cacheUsersSelectors

const {
  updateUserEthCollectibles,
  updateUserSolCollectibles,
  updateSolCollections,
  setHasUnsupportedCollection
} = collectiblesActions

const { fetchPermissions } = chatActions

function* watchFetchProfileSucceeded() {
  yield takeEvery(profileActions.FETCH_PROFILE_SUCCEEDED, profileSucceededAsync)
}

function* fetchProfileCustomizedCollectibles(user) {
  const sdk = yield getSDK()
  const cid = user?.metadata_multihash ?? null
  if (cid) {
    const {
      data: { data: metadata }
    } = yield call([sdk.full.cidData, sdk.full.cidData.getMetadata], {
      metadataId: cid
    })
    if (metadata?.collectibles) {
      yield put(
        cacheActions.update(Kind.USERS, [
          {
            id: user.user_id,
            metadata: {
              collectibles: metadata.collectibles,
              collectiblesOrderUnset: false
            }
          }
        ])
      )
    } else {
      yield put(
        cacheActions.update(Kind.USERS, [
          {
            id: user.user_id,
            metadata: {
              collectiblesOrderUnset: true
            }
          }
        ])
      )
    }
  }
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

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          collectibleList
        }
      }
    ])
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
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          collectibleList: collectiblesWithCollections
        }
      }
    ])
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

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: { solanaCollectibleList }
      }
    ])
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

function* profileSucceededAsync(action) {
  const { userId } = action

  const user = yield select(getUser, { id: userId })
  if (!user) {
    return
  }

  try {
    // Get chat permissions
    yield put(fetchPermissions({ userIds: [user.user_id] }))

    yield fork(fetchProfileCustomizedCollectibles, user)
    yield fork(fetchEthereumCollectibles, user)
    yield fork(fetchSolanaCollectibles, user)

    // Get current user notification & subscription status
    const isSubscribed = !!user.does_current_user_subscribe

    yield put(
      profileActions.setNotificationSubscription(
        user.user_id,
        isSubscribed,
        false,
        user.handle
      )
    )
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

function* watchSetNotificationSubscription() {
  yield takeEvery(
    profileActions.SET_NOTIFICATION_SUBSCRIPTION,
    function* (action) {
      // Discovery automatically subscribes on follow so only update if not a subscribe
      // on follow.
      if (action.update) {
        try {
          if (action.isSubscribed) {
            yield fork(subscribeToUserAsync, action.userId)
          } else {
            yield fork(unsubscribeFromUserAsync, action.userId)
          }
        } catch (err) {
          const isReachable = yield select(getIsReachable)
          if (!isReachable) return
          throw err
        }
      }
    }
  )
}

export default function sagas() {
  return [
    ...feedSagas(),
    ...tracksSagas(),
    watchFetchProfileSucceeded,
    watchSetNotificationSubscription
  ]
}
