import { useMemo } from 'react'

import { useSelector } from 'react-redux'

import { useCurrentAccount } from '~/api'
import { Chain } from '~/models/Chain'
import { Collection } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import {
  AccessConditions,
  Track,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '~/models/Track'
import { FeatureFlags } from '~/services/remote-config'
import { getHasAccount } from '~/store/account/selectors'
import {
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors
} from '~/store/cache'
import { gatedContentSelectors } from '~/store/gated-content'
import { CommonState } from '~/store/reducers'
import {
  isContentPartialCollection,
  isContentPartialTrack
} from '~/utils/contentTypeUtils'
import { Nullable, removeNullable } from '~/utils/typeUtils'

import { useFeatureFlag } from './useFeatureFlag'

const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const { getUser, getUsers } = cacheUsersSelectors
const { getLockedContentId, getNftAccessSignatureMap } = gatedContentSelectors

// TODO nft stuff
export const useGatedTrackAccess = (trackId: ID) => {
  const hasStreamAccess = useSelector((state: CommonState) => {
    const track = getTrack(state, { id: trackId })
    if (!track) return false
    const { is_stream_gated, access } = track
    return !is_stream_gated || !!access?.stream
  })

  const hasDownloadAccess = useSelector((state: CommonState) => {
    const track = getTrack(state, { id: trackId })
    if (!track) return false
    const { is_download_gated, access } = track
    return !is_download_gated || !!access?.download
  })

  return { hasStreamAccess, hasDownloadAccess }
}

export const useGatedCollectionAccess = (collectionId: ID) => {
  const hasStreamAccess = useSelector((state: CommonState) => {
    const collection = getCollection(state, { id: collectionId })
    if (!collection) return false
    const { is_stream_gated, access } = collection
    return !is_stream_gated || !!access?.stream
  })

  return { hasStreamAccess }
}

type PartialTrack = Pick<
  Track,
  | 'track_id'
  | 'is_stream_gated'
  | 'is_download_gated'
  | 'access'
  | 'stream_conditions'
  | 'download_conditions'
>

type PartialCollection = Pick<
  Collection,
  'playlist_id' | 'is_stream_gated' | 'access' | 'stream_conditions'
>

// Returns whether user has access to given track.
export const useGatedContentAccess = (
  content: Nullable<PartialTrack> | Nullable<PartialCollection> | undefined
) => {
  const nftAccessSignatureMap = useSelector(getNftAccessSignatureMap)
  const hasAccount = useSelector(getHasAccount)

  const { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess } =
    useMemo(() => {
      if (!content) {
        return {
          isFetchingNFTAccess: false,
          hasStreamAccess: true,
          hasDownloadAccess: true
        }
      }

      const isTrack = isContentPartialTrack<PartialTrack>(content)
      const isCollection =
        isContentPartialCollection<PartialCollection>(content)
      const trackId = isTrack
        ? content.track_id
        : isCollection
          ? content.playlist_id
          : null
      const { is_stream_gated: isStreamGated } = content
      const isDownloadGated = isTrack ? content.is_download_gated : undefined

      const { stream, download } = content.access ?? {}
      const hasNftAccessSignature = !!(
        trackId && nftAccessSignatureMap[trackId]
      )
      const isCollectibleGated = isContentCollectibleGated(
        content.stream_conditions
      )
      const isSignatureToBeFetched =
        isCollectibleGated &&
        !!trackId &&
        // if nft gated track, the signature would have been fetched separately
        nftAccessSignatureMap[trackId] === undefined &&
        // signature is fetched only if the user is logged in
        hasAccount

      return {
        isFetchingNFTAccess: !hasNftAccessSignature && isSignatureToBeFetched,
        hasStreamAccess: !isStreamGated || !!stream,
        hasDownloadAccess: !isDownloadGated || !!download
      }
    }, [content, nftAccessSignatureMap, hasAccount])

  return { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess }
}

// Similar to `useGatedContentAccess` above, but for multiple tracks.
// Returns a map of track id -> track access i.e.
// {[id: ID]: { isFetchingNFTAccess: boolean, hasStreamAccess: boolean }}
export const useGatedContentAccessMap = (tracks: Partial<Track>[]) => {
  const nftAccessSignatureMap = useSelector(getNftAccessSignatureMap)
  const hasAccount = useSelector(getHasAccount)

  const result = useMemo(() => {
    const map: {
      [id: ID]: { isFetchingNFTAccess: boolean; hasStreamAccess: boolean }
    } = {}

    tracks.forEach((track) => {
      if (!track.track_id) {
        return
      }

      const trackId = track.track_id
      const hasNftAccessSignature = !!nftAccessSignatureMap[trackId]
      const isCollectibleGated = isContentCollectibleGated(
        track.stream_conditions
      )
      const isSignatureToBeFetched =
        isCollectibleGated &&
        // if nft gated track, the signature would have been fetched separately
        nftAccessSignatureMap[trackId] === undefined &&
        // signature is fetched only if the user is logged in
        hasAccount

      map[trackId] = {
        isFetchingNFTAccess: !hasNftAccessSignature && isSignatureToBeFetched,
        hasStreamAccess: !track.is_stream_gated || !!track.access?.stream
      }
    })

    return map
  }, [tracks, nftAccessSignatureMap, hasAccount])

  return result
}

export const useStreamConditionsEntity = (
  streamConditions: Nullable<AccessConditions>
) => {
  const followUserId = isContentFollowGated(streamConditions)
    ? streamConditions?.follow_user_id
    : null
  const tipUserId = isContentTipGated(streamConditions)
    ? streamConditions?.tip_user_id
    : null
  const nftCollection = isContentCollectibleGated(streamConditions)
    ? streamConditions?.nft_collection
    : null

  const users = useSelector((state: CommonState) =>
    getUsers(state, {
      ids: [followUserId, tipUserId].filter(removeNullable)
    })
  )
  const followee = followUserId ? users[followUserId]?.metadata : null
  const tippedUser = tipUserId ? users[tipUserId]?.metadata : null

  const collectionLink = useMemo(() => {
    if (!nftCollection) return ''

    const { chain, address, externalLink } = nftCollection
    if (chain === Chain.Eth && 'slug' in nftCollection) {
      return `https://opensea.io/collection/${nftCollection.slug}`
    } else if (chain === Chain.Sol) {
      const explorerUrl = `https://explorer.solana.com/address/${address}`
      const externalUrl = externalLink ? new URL(externalLink) : null
      return externalUrl
        ? `${externalUrl.protocol}//${externalUrl.hostname}`
        : explorerUrl
    }

    return ''
  }, [nftCollection])

  return {
    nftCollection: nftCollection ?? null,
    collectionLink,
    followee,
    tippedUser
  }
}

export const useLockedContent = () => {
  const id = useSelector(getLockedContentId)
  const track = useSelector((state: CommonState) => getTrack(state, { id }))
  const owner = useSelector((state: CommonState) => {
    return track?.owner_id ? getUser(state, { id: track.owner_id }) : null
  })

  return { id, track, owner }
}

export const useDownloadableContentAccess = ({ trackId }: { trackId: ID }) => {
  const { isEnabled: isUsdcPurchasesEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const { data: currentAccount, isPending } = useCurrentAccount()
  const isOwner = track?.owner_id === currentAccount?.userId

  const price = isContentUSDCPurchaseGated(track?.download_conditions)
    ? track?.download_conditions.usdc_purchase.price
    : undefined

  if (isPending) {
    return {
      price,
      shouldDisplayPremiumDownloadLocked: false,
      shouldDisplayPremiumDownloadUnlocked: false,
      shouldDisplayOwnerPremiumDownloads: false,
      shouldDisplayDownloadFollowGated: false
    }
  }

  // Only display downloadable-content-specific gated UI if the track is not
  // stream-gated
  const isDownloadGatedOnly =
    !track?.is_stream_gated && !!track?.is_download_gated
  const shouldDisplayDownloadFollowGated =
    isDownloadGatedOnly &&
    isContentFollowGated(track?.download_conditions) &&
    track?.access?.download === false &&
    !isOwner
  const isOnlyDownloadableContentPurchaseGated =
    isDownloadGatedOnly &&
    isContentUSDCPurchaseGated(track?.download_conditions)

  return {
    price,
    shouldDisplayPremiumDownloadLocked:
      isOnlyDownloadableContentPurchaseGated &&
      track?.access?.download === false &&
      !isOwner &&
      isUsdcPurchasesEnabled,
    shouldDisplayPremiumDownloadUnlocked:
      isOnlyDownloadableContentPurchaseGated &&
      track?.access?.download === true &&
      !isOwner &&
      isUsdcPurchasesEnabled,
    shouldDisplayOwnerPremiumDownloads:
      isOnlyDownloadableContentPurchaseGated &&
      track?.access?.download === true &&
      isOwner &&
      isUsdcPurchasesEnabled,
    shouldDisplayDownloadFollowGated
  }
}
