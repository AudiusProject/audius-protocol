import type { ID } from '@audius/common'
import { makeGetTierAndVerifiedForUser } from '@audius/common'
import { useSelector } from 'react-redux'

const getTierAndVerifiedForUser = makeGetTierAndVerifiedForUser()

/**
 * This was copied over from audius-client and useSelector was replaced
 * with useSelectorWeb.
 */
export const useSelectTierInfo = (userId: ID) =>
  useSelector((state) => getTierAndVerifiedForUser(state, { userId }))
