import { useSelector } from 'react-redux'

import { ID } from '../models'
import { CommonState, makeGetTierAndVerifiedForUser } from '../store'

const getTierAndVerifiedForUser = makeGetTierAndVerifiedForUser()

/**
 * Wraps our reselect tier selector in useMemo and useSelector
 * to be safe for use in multiple components
 * @param userId
 */
export const useSelectTierInfo = (userId: ID) => {
  return useSelector((state: CommonState) => {
    return getTierAndVerifiedForUser(state, { userId })
  })
}
