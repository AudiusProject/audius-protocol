import { useCurrentUserId } from '@audius/common/api'
import {
  useTierAndVerifiedForUser,
  profilePageSelectors
} from '@audius/common/store'
import { useSelector } from 'react-redux'

const { getProfileUser } = profilePageSelectors

/**
 * Gets the tier for the current profile page, falling back
 * to the current user tier if no such page exists.
 * If the current user doesn't have a tier, this just
 * shows the Gold tier.
 */
export const useProfileTier = () => {
  const profile = useSelector(getProfileUser)
  const { data: accountUserId } = useCurrentUserId()
  const userId = profile?.user_id ?? accountUserId ?? 0
  const { tier } = useTierAndVerifiedForUser(userId)
  return tier === 'none' ? 'gold' : tier
}
