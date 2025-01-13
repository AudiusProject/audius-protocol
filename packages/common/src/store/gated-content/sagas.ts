import { Id, OptionalId } from '@audius/sdk'
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
  transformAndCleanList,
  userCollectionMetadataFromSDK,
  userTrackMetadataFromSDK
} from '~/adapters'
import {
  Chain,
  Collectible,
  ID,
  Kind,
  Name,
  Track,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  NFTAccessSignature,
  GatedContentStatus
} from '~/models'
import { User } from '~/models/User'
import { IntKeys } from '~/services/remote-config'
import { accountSelectors } from '~/store/account'
import { cacheActions, cacheTracksSelectors } from '~/store/cache'
import { collectiblesActions } from '~/store/collectibles'
import { getContext } from '~/store/effects'
import { musicConfettiActions } from '~/store/music-confetti'
import { usersSocialActions } from '~/store/social'
import { tippingActions } from '~/store/tipping'
import { Nullable } from '~/utils/typeUtils'

import { getCollection } from '../cache/collections/selectors'
import { getTrack } from '../cache/tracks/selectors'
import { PurchaseableContentType } from '../purchase-content'
import { getSDK } from '../sdkUtils'

import * as gatedContentSelectors from './selectors'
import { actions as gatedContentActions } from './slice'

const DEFAULT_GATED_TRACK_POLL_INTERVAL_MS = 1000

const {
  updateNftAccessSignatures,
  revokeAccess,
  updateGatedContentStatus,
  updateGatedContentStatuses,
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
    if (c.heliusCollection) {
      solCollectionMintSet.add(c.heliusCollection.address)
    } else if (c.solanaChainMetadata) {
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
        stream_conditions: streamConditions,
        download_conditions: downloadConditions
      } = tracks[trackId]
      const conditions = streamConditions ?? downloadConditions
      if (!conditions || !isContentCollectibleGated(conditions)) return

      // Set the token ids for ERC1155 nfts as the balanceOf contract method
      // which will be used to determine ownership requires the user's
      // wallet address and token ids

      // todo: fix the string nft_collection to be an object
      // temporarily parse it into object here for now
      let { nft_collection: nftCollection } = conditions
      if (typeof nftCollection === 'string') {
        nftCollection = JSON.parse(
          (nftCollection as unknown as string).replaceAll("'", '"')
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

  const statusMap: { [id: ID]: GatedContentStatus } = {}

  const tracksThatNeedSignature = Object.values(tracks).filter((track) => {
    const {
      track_id: trackId,
      owner_id: ownerId,
      stream_conditions: streamConditions,
      download_conditions: downloadConditions,
      access
    } = track

    // Ignore updates that are nft access signature only,
    // i.e. make sure the above properties exist before proceeding.
    if (!trackId || !ownerId || !(streamConditions || downloadConditions)) {
      return false
    }

    if (streamConditions) {
      const hasNoStreamAccess = !access?.stream
      const isFollowGated = isContentFollowGated(streamConditions)
      const isTipGated = isContentTipGated(streamConditions)
      const shouldHaveStreamAccess =
        (isFollowGated && followeeIds.includes(ownerId)) ||
        (isTipGated && tippedUserIds.includes(ownerId))

      if (hasNoStreamAccess && shouldHaveStreamAccess) {
        statusMap[trackId] = 'UNLOCKING'
        // note: if necessary, update some ui status to show that the track download is unlocking
        return true
      }
    } else if (downloadConditions) {
      const hasNoDownloadAccess = !access?.download
      const isFollowGated = isContentFollowGated(downloadConditions)
      const shouldHaveDownloadAccess =
        isFollowGated && followeeIds.includes(ownerId)

      if (hasNoDownloadAccess && shouldHaveDownloadAccess) {
        // note: if necessary, update some ui status to show that the track download is unlocking
        return true
      }
    }
    return false
  })

  yield* put(updateGatedContentStatuses(statusMap))

  yield* all(
    tracksThatNeedSignature.map((track) => {
      const trackId = track.track_id
      return call(pollGatedContent, {
        contentId: trackId,
        contentType: PurchaseableContentType.TRACK,
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

  const sdk = yield* getSDK()

  /** Endpoint accepts an array of track_ids and an array of token_id specifications which map to them
   * The entry in each token_id array is a hyphen-delimited list of tokenIds.
   * Example:
   *   trackMap: { 1: [1, 2], 2: [], 3: [1]}
   *   query params: '?track_ids=1&token_ids=1-2&track_ids=2&token_ids=&track_ids=3&token_ids=1'
   */
  const trackIds: number[] = []
  const tokenIds: string[] = []
  Object.keys(trackMap).forEach((trackId) => {
    const id = parseInt(trackId)
    if (Number.isNaN(id)) {
      console.warn(`Invalid track id: ${trackId}`)
      return
    }
    trackIds.push(id)
    tokenIds.push(trackMap[trackId].join('-'))
  })
  const { data: nftGatedTrackSignatureResponse = {} } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getNFTGatedTrackSignatures],
    {
      userId: Id.parse(account.user_id),
      trackIds,
      tokenIds
    }
  )

  if (nftGatedTrackSignatureResponse) {
    // Keep record of number of tracks that have a signature
    // so that we can later track their metrics.
    let numTrackIdsWithSignature = 0

    const nftGatedTrackSignatureMap: {
      [id: ID]: Nullable<NFTAccessSignature>
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
 * - Updates the store with new stream and download signatures.
 * - Skips tracks whose signatures have already been previously obtained.
 * - Handles newly loading special access tracks that should have a signature but do not yet.
 * - Builds a map of nft-gated track ids (and potentially their respective nft token ids) to
 *   make a request to DN which confirms that user owns the corresponding nft collections by
 *   returning corresponding stream and download signatures.
 */
function* updateGatedContentAccess(
  action:
    | ReturnType<typeof updateUserEthCollectibles>
    | ReturnType<typeof updateUserSolCollectibles>
    | ReturnType<typeof cacheActions.addSucceeded>
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
    [id: ID]: Nullable<NFTAccessSignature>
  } = {}
  Object.keys(allTracks).forEach((trackId) => {
    const id = parseInt(trackId)
    if (skipped.has(id)) return

    const {
      stream_conditions: streamConditions,
      download_conditions: downloadConditions
    } = allTracks[trackId]
    const isCollectibleGated =
      isContentCollectibleGated(streamConditions) ||
      isContentCollectibleGated(downloadConditions)
    if (isCollectibleGated && !trackMap[id]) {
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

export function* pollGatedContent({
  contentId,
  contentType,
  currentUserId,
  isSourceTrack
}: {
  contentId: ID
  contentType: PurchaseableContentType
  currentUserId: number
  isSourceTrack?: boolean
}) {
  const analytics = yield* getContext('analytics')
  const sdk = yield* getSDK()
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)
  const frequency =
    remoteConfigInstance.getRemoteVar(IntKeys.GATED_TRACK_POLL_INTERVAL_MS) ??
    DEFAULT_GATED_TRACK_POLL_INTERVAL_MS

  // get initial track metadata to determine whether we are polling for stream or download access
  const isAlbum = contentType === PurchaseableContentType.ALBUM
  const cachedEntity = isAlbum
    ? yield* select(getCollection, { id: contentId })
    : yield* select(getTrack, {
        id: contentId
      })
  const initiallyHadNoStreamAccess = !cachedEntity?.access.stream
  const initiallyHadNoDownloadAccess = !cachedEntity?.access.download

  // poll for access until it is granted
  while (true) {
    const apiEntity = isAlbum
      ? yield* call(async () => {
          const { data = [] } = await sdk.full.playlists.getPlaylist({
            playlistId: Id.parse(contentId),
            userId: OptionalId.parse(currentUserId)
          })
          return transformAndCleanList(data, userCollectionMetadataFromSDK)[0]
        })
      : yield* call(async () => {
          const { data } = await sdk.full.tracks.getTrack({
            trackId: Id.parse(contentId),
            userId: OptionalId.parse(currentUserId)
          })
          return data ? userTrackMetadataFromSDK(data) : null
        })

    if (!apiEntity?.access) {
      throw new Error(
        `Could not retrieve entity with access for ${contentType} ${contentId}`
      )
    }

    const ownerId =
      'playlist_owner_id' in apiEntity // isAlbum
        ? apiEntity.playlist_owner_id
        : apiEntity.owner_id

    const currentlyHasStreamAccess = !!apiEntity.access.stream
    const currentlyHasDownloadAccess = !!apiEntity.access.download

    // Update the cache with the new metadata so that the UI
    // can update and the content can be streamed or downloaded properly.
    yield* put(
      cacheActions.update(isAlbum ? Kind.COLLECTIONS : Kind.TRACKS, [
        {
          id: contentId,
          metadata: apiEntity
        }
      ])
    )
    if (initiallyHadNoStreamAccess && currentlyHasStreamAccess) {
      yield* put(updateGatedContentStatus({ contentId, status: 'UNLOCKED' }))
      // note: if necessary, update some ui status to show that the download is unlocked
      yield* put(removeFolloweeId({ id: ownerId }))
      yield* put(removeTippedUserId({ id: ownerId }))

      // Show confetti if track is unlocked from the how to unlock section on track/collection page or modal
      if (isSourceTrack) {
        yield* put(showConfetti())
      }

      if (!apiEntity.stream_conditions) {
        return
      }

      const getEventName = () => {
        if (isContentUSDCPurchaseGated(apiEntity.stream_conditions)) {
          return isAlbum
            ? Name.USDC_PURCHASE_GATED_COLLECTION_UNLOCKED
            : Name.USDC_PURCHASE_GATED_TRACK_UNLOCKED
        }
        if (isContentFollowGated(apiEntity.stream_conditions)) {
          return Name.FOLLOW_GATED_TRACK_UNLOCKED
        }
        if (isContentTipGated(apiEntity.stream_conditions)) {
          return Name.TIP_GATED_TRACK_UNLOCKED
        }
        return null
      }
      const eventName = getEventName()
      if (eventName) {
        analytics.track({
          eventName,
          properties: {
            contentId
          }
        })
      }
      break
    } else if (initiallyHadNoDownloadAccess && currentlyHasDownloadAccess) {
      // note: if necessary, update some ui status to show that the track download is unlocked
      yield* put(removeFolloweeId({ id: ownerId }))

      // Show confetti if track is unlocked from the how to unlock section on track page or modal
      if (isSourceTrack) {
        yield* put(showConfetti())
      }

      if (
        !('download_conditions' in apiEntity) ||
        !apiEntity.download_conditions
      ) {
        return
      }
      const eventName =
        !isAlbum &&
        (isContentUSDCPurchaseGated(apiEntity.download_conditions)
          ? Name.USDC_PURCHASE_GATED_DOWNLOAD_TRACK_UNLOCKED
          : isContentFollowGated(apiEntity.download_conditions)
            ? Name.FOLLOW_GATED_DOWNLOAD_TRACK_UNLOCKED
            : null)
      if (eventName) {
        analytics.track({
          eventName,
          properties: {
            contentId
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
 * 3. Poll for access for those tracks
 * 4. When access is returned, set those track statuses as 'UNLOCKED'
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

  const statusMap: { [id: ID]: GatedContentStatus } = {}
  const tracksToPoll: Set<ID> = new Set()
  const cachedTracks = yield* select(getTracks, {})

  Object.keys(cachedTracks).forEach((trackId) => {
    const id = parseInt(trackId)
    const {
      owner_id: ownerId,
      stream_conditions: streamConditions,
      download_conditions: downloadConditions
    } = cachedTracks[id]
    const isTrackStreamGated =
      gate === 'follow'
        ? isContentFollowGated(streamConditions)
        : isContentTipGated(streamConditions)
    const isTrackDownloadGated =
      gate === 'follow'
        ? isContentFollowGated(downloadConditions)
        : isContentTipGated(downloadConditions)
    if (isTrackStreamGated && ownerId === trackOwnerId) {
      statusMap[id] = 'UNLOCKING'
      // note: if necessary, update some ui status to show that the track download is unlocking
      tracksToPoll.add(id)
    } else if (isTrackDownloadGated && ownerId === trackOwnerId) {
      // note: if necessary, update some ui status to show that the track download is unlocking
      tracksToPoll.add(id)
    }
  })

  yield* put(updateGatedContentStatuses(statusMap))

  yield* all(
    Array.from(tracksToPoll).map((trackId) => {
      return call(pollGatedContent, {
        contentId: trackId,
        contentType: PurchaseableContentType.TRACK,
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

  const statusMap: { [id: ID]: GatedContentStatus } = {}
  const revokeAccessMap: { [id: ID]: 'stream' | 'download' } = {}
  const cachedTracks = yield* select(getTracks, {})

  Object.keys(cachedTracks).forEach((trackId) => {
    const id = parseInt(trackId)
    const {
      owner_id: ownerId,
      stream_conditions: streamConditions,
      download_conditions: downloadConditions
    } = cachedTracks[id]
    const isStreamFollowGated = isContentFollowGated(streamConditions)
    const isDownloadFollowGated = isContentFollowGated(downloadConditions)
    if (isStreamFollowGated && ownerId === action.userId) {
      statusMap[id] = 'LOCKED'
      // note: if necessary, update some ui status to show that the track download is locked
      revokeAccessMap[id] = 'stream'
    } else if (isDownloadFollowGated && ownerId === action.userId) {
      // note: if necessary, update some ui status to show that the track download is locked
      revokeAccessMap[id] = 'download'
    }
  })

  yield* put(updateGatedContentStatuses(statusMap))
  yield* put(revokeAccess({ revokeAccessMap }))
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
  const { revokeAccessMap } = action.payload
  const metadatas = Object.keys(revokeAccessMap).map((trackId) => {
    const access =
      revokeAccessMap[trackId] === 'stream'
        ? { stream: false, download: false }
        : { stream: true, download: false }
    const id = parseInt(trackId)
    return {
      id,
      metadata: { access }
    }
  })
  yield* put(cacheActions.update(Kind.TRACKS, metadatas))
}

function* watchGatedTracks() {
  yield* takeEvery(
    [
      cacheActions.ADD_SUCCEEDED,
      updateUserEthCollectibles.type,
      updateUserSolCollectibles.type
    ],
    updateGatedContentAccess
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
