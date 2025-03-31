import { useSelectTierInfo } from '@audius/common/hooks'
import { accountSelectors, profilePageSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

const { getProfileUser } = profilePageSelectors
const { getUserId } = accountSelectors

/**
 * Gets the tier for the current profile page, falling back
 * to the current user tier if no such page exists.
 * If the current user doesn't have a tier, this just
 * shows the Gold tier.
 */
export const useProfileTier = () => {
  const profile = useSelector(getProfileUser)
  const accountUserId = useSelector(getUserId)
  const userId = profile?.user_id ?? accountUserId ?? 0
  const { tier } = useSelectTierInfo(userId)
  return tier === 'none' ? 'gold' : tier
}
