import { ID } from '../models'
import { makeGetTierAndVerifiedForUser } from '../store'

import { useProxySelector } from './useProxySelector'

const getTierAndVerifiedForUser = makeGetTierAndVerifiedForUser()

/**
 * Wraps our reselect tier selector in useMemo and useSelector
 * to be safe for use in multiple components
 */
export const useSelectTierInfo = (userId: ID) => {
  return useProxySelector(
    (state) => getTierAndVerifiedForUser(state, { userId }),
    [userId]
  )
}
