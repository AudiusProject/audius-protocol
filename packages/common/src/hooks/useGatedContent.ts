import { useMemo } from 'react'

import { useSelector } from 'react-redux'

import { Chain } from '~/models/Chain'
import { ID } from '~/models/Identifiers'
import {
  AccessConditions,
  Track,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '~/models/Track'
import { useGetCurrentUserId } from '~/api'
import { getAccountUser } from '~/store/account/selectors'
import { cacheTracksSelectors, cacheUsersSelectors } from '~/store/cache'
import { gatedContentSelectors } from '~/store/gated-content'
import { CommonState } from '~/store/reducers'
import { Nullable, removeNullable } from '~/utils'

const { getTrack } = cacheTracksSelectors
const { getUser, getUsers } = cacheUsersSelectors
const { getLockedContentId, getNftAccessSignatureMap } = gatedContentSelectors

// Returns whether user has access to given track.
export const useGatedContentAccess = (track: Nullable<Partial<Track>>) => {
  const nftAccessSignatureMap = useSelector(getNftAccessSignatureMap)
  const user = useSelector(getAccountUser)

  const { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess } =
    useMemo(() => {
      if (!track) {
        return {
          isFetchingNFTAccess: false,
          hasStreamAccess: true,
          hasDownloadAccess: true
        }
      }

      const trackId = track.track_id
      const {
        is_stream_gated: isStreamGated,
        is_download_gated: isDownloadGated
      } = track
      const { stream, download } = track.access ?? {}
      const hasNftAccessSignature = !!(
        trackId && nftAccessSignatureMap[trackId]
      )
      const isCollectibleGated = isContentCollectibleGated(
        track.stream_conditions
      )
      const isSignatureToBeFetched =
        isCollectibleGated &&
        !!trackId &&
        // if nft gated track, the signature would have been fetched separately
        nftAccessSignatureMap[trackId] === undefined &&
        // signature is fetched only if the user is logged in
        !!user

      return {
        isFetchingNFTAccess: !hasNftAccessSignature && isSignatureToBeFetched,
        hasStreamAccess: !isStreamGated || !!stream,
        hasDownloadAccess: !isDownloadGated || !!download
      }
    }, [track, nftAccessSignatureMap, user])

  return { isFetchingNFTAccess, hasStreamAccess, hasDownloadAccess }
}

// Similar to `useGatedContentAccess` above, but for multiple tracks.
// Returns a map of track id -> track access i.e.
// {[id: ID]: { isFetchingNFTAccess: boolean, hasStreamAccess: boolean }}
export const useGatedContentAccessMap = (tracks: Partial<Track>[]) => {
  const nftAccessSignatureMap = useSelector(getNftAccessSignatureMap)
  const user = useSelector(getAccountUser)

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
        !!user

      map[trackId] = {
        isFetchingNFTAccess: !hasNftAccessSignature && isSignatureToBeFetched,
        hasStreamAccess: !track.is_stream_gated || !!track.access?.stream
      }
    })

    return map
  }, [tracks, nftAccessSignatureMap, user])

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
  const followee = followUserId ? users[followUserId] : null
  const tippedUser = tipUserId ? users[tipUserId] : null

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
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const { data: currentUserId } = useGetCurrentUserId({})
  const isOwner = track?.owner_id === currentUserId
  // Only display downloadable-content-specific gated UI if the track is not
  // stream-gated
  const isDownloadGatedOnly =
    !track?.is_stream_gated && track?.is_download_gated
  const shouldDisplayDownloadFollowGated =
    isDownloadGatedOnly &&
    isContentFollowGated(track?.download_conditions) &&
    track?.access?.download === false &&
    !isOwner
  const isOnlyDownloadableContentPurchaseGated =
    isDownloadGatedOnly &&
    isContentUSDCPurchaseGated(track?.download_conditions)
  const price = isContentUSDCPurchaseGated(track?.download_conditions)
    ? track?.download_conditions.usdc_purchase.price
    : undefined

  return {
    price,
    shouldDisplayPremiumDownloadLocked:
      isOnlyDownloadableContentPurchaseGated &&
      track?.access?.download === false &&
      !isOwner,
    shouldDisplayPremiumDownloadUnlocked:
      isOnlyDownloadableContentPurchaseGated &&
      track?.access?.download === true &&
      !isOwner,
    shouldDisplayDownloadFollowGated
  }
}
