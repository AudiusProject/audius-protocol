import { ID } from 'models/common/Identifiers'
import { useMemo } from 'react'
import { useSelector } from 'utils/reducer'
import { makeGetTierAndVerifiedForUser } from './utils'
import { getProfileUser } from 'containers/profile-page/store/selectors'
import { getAccountUser } from 'store/account/selectors'

/**
 * Wraps our reselect tier selector in useMemo and useSelector
 * to be safe for use in multiple components
 * @param userId
 */
export const useSelectTierInfo = (userId: ID) => {
  const tierAndVerifiedSelector = useMemo(makeGetTierAndVerifiedForUser, [])
  const res = useSelector(state => {
    return tierAndVerifiedSelector(state, { userId })
  })
  return res
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
