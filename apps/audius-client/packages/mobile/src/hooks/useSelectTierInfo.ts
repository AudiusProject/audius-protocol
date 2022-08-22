import type { ID } from '@audius/common'
import { makeGetTierAndVerifiedForUser } from '@audius/common'

import { isEqual, useSelectorWeb } from './useSelectorWeb'

const getTierAndVerifiedForUser = makeGetTierAndVerifiedForUser()

/**
 * This was copied over from audius-client and useSelector was replaced
 * with useSelectorWeb.
 */
export const useSelectTierInfo = (userId: ID) => {
  return useSelectorWeb((state) => {
    return getTierAndVerifiedForUser(state, { userId })
  }, isEqual)
}
