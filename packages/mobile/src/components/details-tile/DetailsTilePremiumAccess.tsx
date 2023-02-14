import type { ID, PremiumConditions } from '@audius/common'
import { removeNullable, cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'

const { getUsers } = cacheUsersSelectors

type DetailsTilePremiumAccessProps = {
  trackId: ID
  premiumConditions: PremiumConditions
  isOwner: boolean
  doesUserHaveAccess: boolean
}

export const DetailsTilePremiumAccess = ({
  trackId,
  premiumConditions,
  isOwner,
  doesUserHaveAccess
}: DetailsTilePremiumAccessProps) => {
  const { follow_user_id: followUserId, tip_user_id: tipUserId } =
    premiumConditions ?? {}
  const users = useSelector((state) =>
    getUsers(state, {
      ids: [followUserId, tipUserId].filter(removeNullable)
    })
  )
  const followee = followUserId ? users[followUserId] : null
  const tippedUser = tipUserId ? users[tipUserId] : null
  const shouldDisplay =
    !!premiumConditions.nft_collection || followee || tippedUser

  if (!shouldDisplay) return null

  if (doesUserHaveAccess) {
    return (
      <DetailsTileHasAccess
        premiumConditions={premiumConditions}
        isOwner={isOwner}
      />
    )
  }

  return (
    <DetailsTileNoAccess
      trackId={trackId}
      premiumConditions={premiumConditions}
    />
  )
}
