import { useSelectTierInfo } from '@audius/common/hooks'
import { accountSelectors, profilePageSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

const { getProfileUser } = profilePageSelectors
const getAccountUser = accountSelectors.getAccountUser

/**
 * Gets the tier for the current profile page, falling back
 * to the current user tier if no such page exists.
 * If the current user doesn't have a tier, this just
 * shows the Gold tier.
 */
export const useProfileTier = () => {
  const profile = useSelector(getProfileUser)
  const accountUser = useSelector(getAccountUser)
  const userId = profile?.user_id ?? accountUser?.user_id ?? 0
  const { tier } = useSelectTierInfo(userId)
  return tier === 'none' ? 'gold' : tier
}
