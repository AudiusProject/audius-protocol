import {
  cacheActions,
  accountSelectors,
  cacheTracksSelectors,
  Collectible,
  User,
  Track,
  getContext,
  Kind,
  PremiumContentSignature,
  ID,
  Chain,
  FeatureFlags,
  premiumContentSelectors,
  premiumContentActions,
  TrackMetadata
} from '@audius/common'
import { takeLatest, select, call, put } from 'typed-redux-saga'

import { waitForWrite } from 'utils/sagaHelpers'

const {
  updatePremiumContentSignatures,
  ethNFTsFetched,
  solNFTsFetched,
  ETH_NFTS_FETCHED,
  SOL_NFTS_FETCHED
} = premiumContentActions

const { getPremiumTrackSignatureMap } = premiumContentSelectors

const { getAccountUser } = accountSelectors
const { getTracks } = cacheTracksSelectors

function hasNotFetchedAllNFTs(account: User) {
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
  premiumTrackSignatureIdSet
}: {
  tracks: { [id: number]: Track }
  ethCollectibles: Collectible[]
  solCollectibles: Collectible[]
  premiumTrackSignatureIdSet: Set<number>
}) {
  const trackMap: { [id: number]: string[] } = {}

  // Handle tracks gated by ethereum nft collections

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

  // todo: Handle tracks gated by solana nft collections

  Object.keys(tracks)
    .map(Number)
    .filter(Boolean)
    .forEach((trackId) => {
      // skip this track entry if we already have a signature for it
      if (premiumTrackSignatureIdSet.has(trackId)) return

      // skip this track entry if it is not premium or if it is not gated on an nft collection
      const { is_premium: isPremium, premium_conditions: premiumConditions } =
        tracks[trackId]
      if (!isPremium || !premiumConditions || !premiumConditions.nft_collection)
        return

      // Set the token ids for ERC1155 nfts as the balanceOf contract method
      // which will be used to determine ownership requires the user's
      // wallet address and token ids

      // todo: fix the string nft_collection to be an object
      // temporarily parse it into object here for now
      let { nft_collection: nftCollection } = premiumConditions
      if (typeof nftCollection === 'string') {
        nftCollection = JSON.parse(
          (premiumConditions.nft_collection as unknown as string).replaceAll(
            "'",
            '"'
          )
        )
      }

      if (nftCollection.chain === Chain.Eth) {
        const tokenIds =
          'address' in nftCollection
            ? ethContractMap[nftCollection.address]
            : undefined
        if (!tokenIds) return

        if (
          'standard' in nftCollection &&
          nftCollection.standard === 'ERC1155'
        ) {
          trackMap[trackId] = ethContractMap[nftCollection.address]
        } else {
          trackMap[trackId] = []
        }
      } else if (nftCollection.chain === Chain.Sol) {
        // todo
      }
    })

  return trackMap
}

function* updateNewPremiumContentSignatures({
  tracks,
  premiumTrackSignatureIdSet
}: {
  tracks: Track[]
  premiumTrackSignatureIdSet: Set<number>
}) {
  const premiumContentSignatureMap: { [id: ID]: PremiumContentSignature } = {}

  tracks.forEach((track: Track) => {
    const {
      premium_content_signature: premiumContentSignature,
      track_id: trackId
    } = track

    // skip this track entry if we already have a signature for it
    if (premiumTrackSignatureIdSet.has(trackId)) return

    // skip this track entry if its metadata does not include a signature
    if (!premiumContentSignature) return

    premiumContentSignatureMap[trackId] = premiumContentSignature
  })

  yield* put(updatePremiumContentSignatures(premiumContentSignatureMap))
}

/**
 * Builds a map of nft-gated track ids and relevant info to make a request to DN
 * which confirms that user owns the corresponding nft collections by returning corresponding premium content signatures.
 *
 * Runs when eth or sol nfts are fetched, or when new tracks have been added to the cache.
 * Halts if not all nfts have been fetched yet. Similarly, does not proceed if no tracks are in the cache yet.
 * Skips tracks whose signatures have already been previously obtained.
 */
function* updateNFTGatedTrackAccess(
  action:
    | ReturnType<typeof ethNFTsFetched>
    | ReturnType<typeof solNFTsFetched>
    | ReturnType<typeof cacheActions.add>
) {
  // Halt if premium content not enabled
  yield waitForWrite()
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  if (!getFeatureEnabled(FeatureFlags.PREMIUM_CONTENT_ENABLED)) {
    return
  }

  // get tracks for which we already previously got the signatures
  // filter out those tracks from the ones that need to be passed in to the DN request
  const premiumTrackSignatureMap = yield* select(getPremiumTrackSignatureMap)
  const premiumTrackSignatureIdSet = new Set(
    Object.keys(premiumTrackSignatureMap).map(Number)
  )

  // update premium content signatures from tracks' metadata with the  signature
  const areTracksAdded =
    'kind' in action && action.kind === Kind.TRACKS && !!action.entries.length
  if (areTracksAdded) {
    yield* call(updateNewPremiumContentSignatures, {
      tracks: action.entries.map(
        ({ metadata }: { metadata: TrackMetadata }) => metadata
      ),
      premiumTrackSignatureIdSet
    })
  }

  // halt if no logged in user
  const account = yield* select(getAccountUser)
  if (!account) return

  // halt if not all nfts have been fetched yet
  if (yield* call(hasNotFetchedAllNFTs, account)) return

  // halt if no tracks in cache and no added tracks
  const cachedTracks = yield* select(getTracks, {})
  const newlyAddedTracks = areTracksAdded ? action.entries : []
  if (!Object.keys(cachedTracks).length && !newlyAddedTracks.length) return

  const allTracks = {
    ...cachedTracks,
    ...newlyAddedTracks.reduce(
      (
        acc: { [id: ID]: Track },
        curr: { id: number; uid: string; metadata: Track }
      ) => {
        acc[curr.metadata.track_id] = curr.metadata
        return acc
      },
      []
    )
  }

  const trackMap = yield* call(getTokenIdMap, {
    tracks: allTracks,
    ethCollectibles: account.collectibleList || [],
    solCollectibles: account.solanaCollectibleList || [],
    premiumTrackSignatureIdSet
  })
  if (!Object.keys(trackMap).length) return

  // request premium content signatures for the relevant nft-gated tracks
  // which the client believes the user should have access to
  const apiClient = yield* getContext('apiClient')
  const premiumContentSignatureMap = yield* call(
    [apiClient, apiClient.getPremiumContentSignatures],
    {
      userId: account.user_id,
      trackMap
    }
  )

  // update premium content signatures
  if (premiumContentSignatureMap) {
    yield* put(updatePremiumContentSignatures(premiumContentSignatureMap))

    // also update premium tracks' metadata with the newly obtained signature
    yield* put(
      cacheActions.update(
        Kind.TRACKS,
        Object.keys(premiumContentSignatureMap).map((trackId) => {
          const id = parseInt(trackId)
          return {
            id,
            metadata: {
              // todo: remove below ts ignore
              // @ts-ignore
              premium_content_signature: premiumContentSignatureMap[id]
            }
          }
        })
      )
    )
  }
}

function* watchNFTGatedTracks() {
  yield takeLatest(
    [cacheActions.ADD, ETH_NFTS_FETCHED, SOL_NFTS_FETCHED],
    updateNFTGatedTrackAccess
  )
}

const sagas = () => {
  return [watchNFTGatedTracks]
}

export default sagas
