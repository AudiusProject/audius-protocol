import {
  takeEvery,
  select,
  call,
  put,
  delay,
  all,
  fork
} from 'typed-redux-saga'

import {
  Chain,
  Collectible,
  ID,
  Kind,
  Name,
  AccessSignature,
  GatedTrackStatus,
  Track,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from 'models'
import { User } from 'models/User'
import { IntKeys } from 'services/remote-config'
import { accountSelectors } from 'store/account'
import { cacheActions, cacheTracksSelectors } from 'store/cache'
import { collectiblesActions } from 'store/collectibles'
import { getContext } from 'store/effects'
import { musicConfettiActions } from 'store/music-confetti'
import { usersSocialActions } from 'store/social'
import { tippingActions } from 'store/tipping'
import { Nullable } from 'utils/typeUtils'

import * as gatedContentSelectors from './selectors'
import { actions as gatedContentActions } from './slice'

const DEFAULT_GATED_TRACK_POLL_INTERVAL_MS = 1000

const {
  updateNftAccessSignatures,
  revokeAccess,
  updateGatedTrackStatus,
  updateGatedTrackStatuses,
  addFolloweeId,
  removeFolloweeId,
  addTippedUserId,
  removeTippedUserId
} = gatedContentActions

const { refreshTipGatedTracks } = tippingActions
const { show: showConfetti } = musicConfettiActions

const { updateUserEthCollectibles, updateUserSolCollectibles } =
  collectiblesActions

const { getNftAccessSignatureMap, getFolloweeIds, getTippedUserIds } =
  gatedContentSelectors

const { getAccountUser, getUserId } = accountSelectors
const { getTracks } = cacheTracksSelectors

function hasNotFetchedAllCollectibles(account: User) {
  const { collectibleList, solanaCollectibleList } = account
  const hasCollectibles = account?.has_collectibles ?? false
  return (
    collectibleList === undefined ||
    solanaCollectibleList === undefined ||
    (hasCollectibles && !account.collectibles)
  )
}

// Map of track ids for which to attempt to get signature.
// Include token ids for ERC1155 nfts.
function* getTokenIdMap({
  tracks,
  ethCollectibles,
  solCollectibles,
  nftAccessSignatureIdSet
}: {
  tracks: { [id: ID]: Track }
  ethCollectibles: Collectible[]
  solCollectibles: Collectible[]
  nftAccessSignatureIdSet: Set<ID>
}) {
  const trackMap: { [id: ID]: string[] } = {}
  const skipped: Set<ID> = new Set()

  // Build map of eth nft contract address -> list of token ids
  // ERC1155 requires token ids to get the balance of a wallet for a given collection
  // We can ignore token ids for ERC721 nfts
  const ethContractMap: { [address: string]: string[] } = {}
  ethCollectibles.forEach((c: Collectible) => {
    if (!c.assetContractAddress) return

    if (ethContractMap[c.assetContractAddress]) {
      ethContractMap[c.assetContractAddress].push(c.tokenId)
    } else {
      ethContractMap[c.assetContractAddress] = [c.tokenId]
    }
  })

  // Build a set of sol nft collection mint addresses
  const solCollectionMintSet: Set<string> = new Set()
  solCollectibles.forEach((c: Collectible) => {
    if (!c.solanaChainMetadata) return

    // "If the Collection field is set, it means the NFT is part of the collection specified within that field."
    // https://docs.metaplex.com/programs/token-metadata/certified-collections#linking-regular-nfts-to-collection-nfts
    const { collection } = c.solanaChainMetadata
    if (collection?.verified) {
      // Weirdly enough, sometimes the key is a string, and other times it's a PublicKey
      // even though the @metaplex-foundation collection type defines it as a web3.PublicKey
      const mintKey =
        typeof collection.key === 'string'
          ? collection.key
          : collection.key.toBase58()
      solCollectionMintSet.add(mintKey)
    }
  })

  Object.keys(tracks)
    .map(Number)
    .filter(Boolean)
    .forEach((trackId) => {
      if (nftAccessSignatureIdSet.has(trackId)) {
        // skip this track entry if we already have a signature for it
        skipped.add(trackId)
        return
      }

      // skip this track entry if it is not gated on an nft collection
      const {
        is_stream_gated: isStreamGated,
        stream_conditions: streamConditions
      } = tracks[trackId]
      if (
        !isStreamGated ||
        !streamConditions ||
        !isContentCollectibleGated(streamConditions)
      )
        return

      // Set the token ids for ERC1155 nfts as the balanceOf contract method
      // which will be used to determine ownership requires the user's
      // wallet address and token ids

      // todo: fix the string nft_collection to be an object
      // temporarily parse it into object here for now
      let { nft_collection: nftCollection } = streamConditions
      if (typeof nftCollection === 'string') {
        nftCollection = JSON.parse(
          (streamConditions.nft_collection as unknown as string).replaceAll(
            "'",
            '"'
          )
        )
      }

      if (nftCollection?.chain === Chain.Eth) {
        // skip this track entry if user does not own an nft from its nft collection gate
        const tokenIds = ethContractMap[nftCollection.address]
        if (!tokenIds || !tokenIds.length) return

        // add trackId <> tokenIds entry if track is gated on ERC1155 nft collection,
        // otherwsise, set tokenIds for trackId to empty array
        trackMap[trackId] =
          nftCollection.standard === 'ERC1155'
            ? ethContractMap[nftCollection.address]
            : []
      } else if (nftCollection?.chain === Chain.Sol) {
        if (solCollectionMintSet.has(nftCollection.address)) {
          // add trackId to trackMap, no need for tokenIds here
          trackMap[trackId] = []
        }
      }
    })

  return { trackMap, skipped }
}

// Poll stream signatures for tracks that should have them but do not yet.
// This happens in rare race conditions where gated tracks are being loaded
// from an artist and the logged in user just very recently unlocked the tracks.
function* handleSpecialAccessTrackSubscriptions(tracks: Track[]) {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const followeeIds = yield* select(getFolloweeIds)
  const tippedUserIds = yield* select(getTippedUserIds)

  const statusMap: { [id: ID]: GatedTrackStatus } = {}

  const tracksThatNeedSignature = Object.values(tracks).filter((track) => {
    const {
      track_id: trackId,
      owner_id: ownerId,
      stream_conditions: streamConditions,
      access,
      permalink
    } = track

    // Ignore updates that are nft access signature only,
    // i.e. make sure the above properties exist before proceeding.
    if (!trackId || !ownerId || !streamConditions || !permalink) {
      return false
    }

    const hasNoStreamAccess = !access?.stream
    const isFollowGated = isContentFollowGated(streamConditions)
    const isTipGated = isContentTipGated(streamConditions)
    const shouldHaveStreamAccess =
      (isFollowGated && followeeIds.includes(ownerId)) ||
      (isTipGated && tippedUserIds.includes(ownerId))

    if (hasNoStreamAccess && shouldHaveStreamAccess) {
      statusMap[trackId] = 'UNLOCKING'
      return true
    }
    return false
  })

  yield* put(updateGatedTrackStatuses(statusMap))

  yield* all(
    tracksThatNeedSignature.map((track) => {
      const trackId = track.track_id
      return call(pollGatedTrack, {
        trackId,
        currentUserId,
        isSourceTrack: false
      })
    })
  )
}

// Request gated content signatures for the relevant nft-gated tracks
// which the client believes the user should have access to.
function* updateCollectibleGatedTracks(trackMap: { [id: ID]: string[] }) {
  const account = yield* select(getAccountUser)
  if (!account) return

  const apiClient = yield* getContext('apiClient')

  const nftGatedTrackSignatureResponse = yield* call(
    [apiClient, apiClient.getNFTGatedTrackSignatures],
    {
      userId: account.user_id,
      trackMap
    }
  )

  if (nftGatedTrackSignatureResponse) {
    // Keep record of number of tracks that have a signature
    // so that we can later track their metrics.
    let numTrackIdsWithSignature = 0

    const nftGatedTrackSignatureMap: {
      [id: ID]: Nullable<AccessSignature>
    } = { ...nftGatedTrackSignatureResponse }
    // Set null for tracks for which signatures did not get returned
    // to signal that an attempt was made but the user does not have access.
    Object.keys(trackMap).forEach((trackId) => {
      const id = parseInt(trackId)
      if (!nftGatedTrackSignatureResponse[id]) {
        nftGatedTrackSignatureMap[id] = null
      } else {
        numTrackIdsWithSignature++
      }
    })

    // Update access fields for tracks that have a nft access signature.
    const metadatas = Object.keys(nftGatedTrackSignatureResponse).map(
      (trackId) => {
        const id = parseInt(trackId)
        return {
          id,
          metadata: {
            access: { stream: true, download: true }
          }
        }
      }
    )
    yield* put(cacheActions.update(Kind.TRACKS, metadatas))

    // Record when collectible gated tracks are in an unlocked state.
    const analytics = yield* getContext('analytics')
    analytics.track({
      eventName: Name.COLLECTIBLE_GATED_TRACK_UNLOCKED,
      properties: {
        count: numTrackIdsWithSignature
      }
    })

    // update nft gated track signatures
    if (Object.keys(nftGatedTrackSignatureMap).length > 0) {
      yield* put(updateNftAccessSignatures(nftGatedTrackSignatureMap))
    }
  }
}

/**
 * This function runs when new tracks have been added to the cache or when eth or sol nfts are fetched.
 * It does a bunch of things (getting gradually larger and should now be broken up):
 * - Updates the store with new stream signatures.
 * - Skips tracks whose signatures have already been previously obtained.
 * - Handles newly loading special access tracks that should have a signature but do not yet.
 * - Builds a map of nft-gated track ids (and potentially their respective nft token ids) to
 *   make a request to DN which confirms that user owns the corresponding nft collections by
 *   returning corresponding stream signatures.
 */
function* updateGatedTrackAccess(
  action:
    | ReturnType<typeof updateUserEthCollectibles>
    | ReturnType<typeof updateUserSolCollectibles>
    | ReturnType<typeof cacheActions.addSucceeded>
    | ReturnType<typeof cacheActions.update>
) {
  const account = yield* select(getAccountUser)

  // Halt if nfts fetched are not for logged in account
  const areCollectiblesFetched = [
    updateUserEthCollectibles.type,
    updateUserSolCollectibles.type
  ].includes(action.type)
  const userIdForCollectibles =
    areCollectiblesFetched && 'payload' in action ? action.payload.userId : null
  if (userIdForCollectibles && account?.user_id !== userIdForCollectibles)
    return

  // get tracks for which we already previously got the signatures
  // filter out those tracks from the ones that need to be passed in to the DN request
  const currentNftAccessSignatureMap = yield* select(getNftAccessSignatureMap)
  const nftAccessSignatureIdSet = new Set(
    Object.keys(currentNftAccessSignatureMap).map(Number)
  )

  const areTracksUpdated =
    'kind' in action && action.kind === Kind.TRACKS && !!action.entries.length

  // halt if no logged in user
  if (!account) return

  // halt if not all nfts have been fetched yet
  if (yield* call(hasNotFetchedAllCollectibles, account)) return

  // halt if no tracks in cache and no added tracks
  const cachedTracks = yield* select(getTracks, {})
  const newlyUpdatedTracks = areTracksUpdated ? action.entries : []
  if (!Object.keys(cachedTracks).length && !newlyUpdatedTracks.length) return

  const allTracks = {
    ...cachedTracks,
    ...newlyUpdatedTracks.reduce((acc: { [id: ID]: Track }, curr: any) => {
      acc[curr.metadata.track_id] = curr.metadata
      return acc
    }, [])
  }

  // Handle newly loading special access tracks that should have a signature but do not yet.
  yield* fork(handleSpecialAccessTrackSubscriptions, Object.values(allTracks))

  const { trackMap, skipped } = yield* call(getTokenIdMap, {
    tracks: allTracks,
    ethCollectibles: account.collectibleList || [],
    solCollectibles: account.solanaCollectibleList || [],
    nftAccessSignatureIdSet
  })

  const updatedNftAccessSignatureMap: {
    [id: ID]: Nullable<AccessSignature>
  } = {}
  Object.keys(allTracks).forEach((trackId) => {
    const id = parseInt(trackId)
    if (skipped.has(id)) return

    const { stream_conditions: streamConditions } = allTracks[trackId]
    if (streamConditions?.nft_collection && !trackMap[id]) {
      // Set null for collectible gated track signatures as
      // the user does not have nfts for those collections
      // and therefore does not have access.
      updatedNftAccessSignatureMap[id] = null
    }
  })

  if (Object.keys(updatedNftAccessSignatureMap).length > 0) {
    yield* put(updateNftAccessSignatures(updatedNftAccessSignatureMap))
  }

  if (!Object.keys(trackMap).length) return

  yield* call(updateCollectibleGatedTracks, trackMap)
}

export function* pollGatedTrack({
  trackId,
  currentUserId,
  isSourceTrack
}: {
  trackId: ID
  currentUserId: number
  isSourceTrack: boolean
}) {
  const analytics = yield* getContext('analytics')
  const apiClient = yield* getContext('apiClient')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)
  const frequency =
    remoteConfigInstance.getRemoteVar(IntKeys.GATED_TRACK_POLL_INTERVAL_MS) ??
    DEFAULT_GATED_TRACK_POLL_INTERVAL_MS

  while (true) {
    const track = yield* call([apiClient, 'getTrack'], {
      id: trackId,
      currentUserId
    })
    if (track?.access?.stream) {
      yield* put(
        cacheActions.update(Kind.TRACKS, [
          {
            id: trackId,
            metadata: {
              access: track.access
            }
          }
        ])
      )
      yield* put(updateGatedTrackStatus({ trackId, status: 'UNLOCKED' }))
      yield* put(removeFolloweeId({ id: track.owner_id }))
      yield* put(removeTippedUserId({ id: track.owner_id }))

      // Show confetti if track is unlocked from the how to unlock section on track page or modal
      if (isSourceTrack) {
        yield* put(showConfetti())
      }

      if (!track.stream_conditions) {
        return
      }
      const eventName = isContentUSDCPurchaseGated(track.stream_conditions)
        ? Name.USDC_PURCHASE_GATED_TRACK_UNLOCKED
        : isContentFollowGated(track.stream_conditions)
        ? Name.FOLLOW_GATED_TRACK_UNLOCKED
        : isContentTipGated(track.stream_conditions)
        ? Name.TIP_GATED_TRACK_UNLOCKED
        : null
      if (eventName) {
        analytics.track({
          eventName,
          properties: {
            trackId
          }
        })
      }

      break
    }
    yield* delay(frequency)
  }
}

/**
 * 1. Get follow or tip gated tracks of user
 * 2. Set those track statuses to 'UNLOCKING'
 * 3. Poll for stream signatures for those tracks
 * 4. When the signatures are returned, set those track statuses as 'UNLOCKED'
 */
function* updateSpecialAccessTracks(
  trackOwnerId: ID,
  gate: 'follow' | 'tip',
  sourceTrackId?: Nullable<ID>
) {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  // Add followee or tipped user id to gated content store to subscribe to
  // polling their newly loaded gated track signatures.
  if (gate === 'follow') {
    yield* put(addFolloweeId({ id: trackOwnerId }))
  } else {
    yield* put(addTippedUserId({ id: trackOwnerId }))
  }

  const statusMap: { [id: ID]: GatedTrackStatus } = {}
  const tracksToPoll: Set<ID> = new Set()
  const cachedTracks = yield* select(getTracks, {})

  Object.keys(cachedTracks).forEach((trackId) => {
    const id = parseInt(trackId)
    const { owner_id: ownerId, stream_conditions: streamConditions } =
      cachedTracks[id]
    const isGated =
      gate === 'follow'
        ? isContentFollowGated(streamConditions)
        : isContentTipGated(streamConditions)
    if (isGated && ownerId === trackOwnerId) {
      statusMap[id] = 'UNLOCKING'
      tracksToPoll.add(id)
    }
  })

  yield* put(updateGatedTrackStatuses(statusMap))

  yield* all(
    Array.from(tracksToPoll).map((trackId) => {
      return call(pollGatedTrack, {
        trackId,
        currentUserId,
        isSourceTrack: sourceTrackId === trackId
      })
    })
  )
}

/**
 * 1. Get follow-gated tracks of unfollowed user
 * 2. Set those track statuses to 'LOCKED'
 * 3. Revoke access for those tracks
 */
function* handleUnfollowUser(
  action: ReturnType<typeof usersSocialActions.unfollowUser>
) {
  // Remove followee from gated content store to unsubscribe from
  // polling their newly loaded follow gated track signatures.
  yield* put(removeFolloweeId({ id: action.userId }))

  const statusMap: { [id: ID]: GatedTrackStatus } = {}
  const cachedTracks = yield* select(getTracks, {})

  Object.keys(cachedTracks).forEach((trackId) => {
    const id = parseInt(trackId)
    const { owner_id: ownerId, stream_conditions: streamConditions } =
      cachedTracks[id]
    const isFollowGated = isContentFollowGated(streamConditions)
    if (isFollowGated && ownerId === action.userId) {
      statusMap[id] = 'LOCKED'
    }
  })

  yield* put(updateGatedTrackStatuses(statusMap))

  const trackIds = Object.keys(statusMap).map((trackId) => parseInt(trackId))
  yield* put(revokeAccess({ trackIds }))
}

function* handleFollowUser(
  action: ReturnType<typeof usersSocialActions.followUser>
) {
  yield* call(
    updateSpecialAccessTracks,
    action.userId,
    'follow',
    action.trackId
  )
}

function* handleTipGatedTracks(
  action: ReturnType<typeof refreshTipGatedTracks>
) {
  yield* call(
    updateSpecialAccessTracks,
    action.payload.userId,
    'tip',
    action.payload.trackId
  )
}

/**
 * Remove stream signatures from track metadata when they're
 * no longer accessible by the user.
 */
function* handleRevokeAccess(action: ReturnType<typeof revokeAccess>) {
  const cachedTracks = yield* select(getTracks, {
    ids: action.payload.trackIds
  })
  const metadatas = Object.keys(cachedTracks).map((trackId) => {
    const id = parseInt(trackId)
    return {
      id,
      metadata: {
        access: { stream: false, download: false }
      }
    }
  })
  yield* put(cacheActions.update(Kind.TRACKS, metadatas))
}

function* watchGatedTracks() {
  yield* takeEvery(
    [
      cacheActions.ADD_SUCCEEDED,
      cacheActions.UPDATE,
      updateUserEthCollectibles.type,
      updateUserSolCollectibles.type
    ],
    updateGatedTrackAccess
  )
}

function* watchFollowGatedTracks() {
  yield* takeEvery(usersSocialActions.FOLLOW_USER, handleFollowUser)
}

function* watchUnfollowGatedTracks() {
  yield* takeEvery(usersSocialActions.UNFOLLOW_USER, handleUnfollowUser)
}

function* watchTipGatedTracks() {
  yield* takeEvery(refreshTipGatedTracks.type, handleTipGatedTracks)
}

function* watchRevokeAccess() {
  yield* takeEvery(revokeAccess.type, handleRevokeAccess)
}

export const sagas = () => {
  return [
    watchGatedTracks,
    watchFollowGatedTracks,
    watchUnfollowGatedTracks,
    watchTipGatedTracks,
    watchRevokeAccess
  ]
}
