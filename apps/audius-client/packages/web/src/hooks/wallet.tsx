import {
  ID,
  accountSelectors,
  profilePageSelectors,
  makeGetTierAndVerifiedForUser
} from '@audius/common'

import { useSelector } from 'utils/reducer'
const { getProfileUser } = profilePageSelectors
const getAccountUser = accountSelectors.getAccountUser

const getTierAndVerifiedForUser = makeGetTierAndVerifiedForUser()

/**
 * Wraps our reselect tier selector in useMemo and useSelector
 * to be safe for use in multiple components
 * @param userId
 */
export const useSelectTierInfo = (userId: ID) => {
  return useSelector((state) => {
    return getTierAndVerifiedForUser(state, { userId })
  })
}
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
