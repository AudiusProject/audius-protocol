import { Chain, PremiumConditions, Track } from 'models'
import { useMemo } from 'react'

import { useSelector } from 'react-redux'
import { cacheTracksSelectors, cacheUsersSelectors } from 'store/cache'
import { premiumContentSelectors } from 'store/premium-content'
import { CommonState } from 'store/reducers'
import { Nullable, removeNullable } from 'utils'

const { getTrack } = cacheTracksSelectors
const { getUser, getUsers } = cacheUsersSelectors
const { getLockedContentId, getPremiumTrackSignatureMap } = premiumContentSelectors

export const usePremiumContentAccess = (track: Nullable<Partial<Track>>) => {
  const premiumTrackSignatureMap = useSelector(getPremiumTrackSignatureMap)

  const { isUserAccessTBD, doesUserHaveAccess } = useMemo(() => {
    if (!track) {
      return { isUserAccessTBD: false, doesUserHaveAccess: true }
    }

    const trackId = track.track_id
    const isPremium = track.is_premium
    const hasPremiumContentSignature =
      !!track.premium_content_signature ||
      !!(trackId && premiumTrackSignatureMap[trackId])
    const isCollectibleGated = !!track.premium_conditions?.nft_collection
    const isSignatureToBeFetched =
      isCollectibleGated &&
      !!trackId &&
      premiumTrackSignatureMap[trackId] === undefined

    return {
      isUserAccessTBD: !hasPremiumContentSignature && isSignatureToBeFetched,
      doesUserHaveAccess: !isPremium || hasPremiumContentSignature
    }
  }, [track, premiumTrackSignatureMap])

  return { isUserAccessTBD, doesUserHaveAccess }
}

export const usePremiumConditionsEntity = (premiumConditions: Nullable<PremiumConditions>) => {
  const { follow_user_id: followUserId, tip_user_id: tipUserId, nft_collection: nftCollection } =
    premiumConditions ?? {}

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
      return externalUrl ? `${externalUrl.protocol}//${externalUrl.hostname}` : explorerUrl
    }

    return ''
  }, [nftCollection])

  return { nftCollection: nftCollection ?? null, collectionLink, followee, tippedUser }
}

export const useLockedContent = () => {
  const id = useSelector(getLockedContentId)
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: id })
  )
  const owner = useSelector((state: CommonState) => {
    return track?.owner_id ? getUser(state, { id: track.owner_id }) : null
  })

  return { id, track, owner }
}
