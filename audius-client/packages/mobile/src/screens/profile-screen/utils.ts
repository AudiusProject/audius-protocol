import { useMemo } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import {
  badgeTiers,
  makeGetTierAndVerifiedForUser
} from 'audius-client/src/components/user-badges/utils'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { MIN_COLLECTIBLES_TIER } from './constants'

/**
 * Wraps our reselect tier selector in useMemo and useSelector
 * to be safe for use in multiple components
 *
 * This was copied over from audius-client and useSelector was replaced
 * with useSelectorWeb.
 */
export const useSelectTierInfo = (userId: ID) => {
  const tierAndVerifiedSelector = useMemo(makeGetTierAndVerifiedForUser, [])
  const res = useSelectorWeb(state => {
    return tierAndVerifiedSelector(state as any, { userId })
  })
  return res
}

/**
 *
 * Encapsulates complex logic for determining whether we should show the
 * profile's collectibles tab.
 *
 * User needs to be at a specific tier, needs to have collectibles,
 * they need to be ordered, and they need to load correctly.
 *
 * If the user is viewing their own profile, the collectibles don't
 * need to be ordered
 */
export const useShouldShowCollectiblesTab = (profile: ProfileUser) => {
  const {
    user_id,
    has_collectibles,
    collectibleList,
    solanaCollectibleList,
    collectibles
  } = profile
  const accountUser = useSelectorWeb(getAccountUser)
  const { tierNumber } = useSelectTierInfo(user_id)

  const hasCollectiblesTierRequirement =
    tierNumber >= badgeTiers.findIndex(t => t.tier === MIN_COLLECTIBLES_TIER)

  if (!hasCollectiblesTierRequirement) return false

  const hasCollectibles =
    collectibleList?.length || solanaCollectibleList?.length
  const hasCollectiblesOrder = Boolean(collectibles?.order?.length)
  const didCollectiblesLoadAndWasEmpty =
    hasCollectibles && !hasCollectiblesOrder

  if (has_collectibles && !didCollectiblesLoadAndWasEmpty) return true

  const neverSetCollectiblesOrder = !collectibles
  const hasVisibleCollectibles =
    hasCollectibles && (neverSetCollectiblesOrder || hasCollectiblesOrder)
  const isUserOnTheirProfile = accountUser?.user_id === user_id

  if (hasVisibleCollectibles) return true

  if (hasCollectibles && isUserOnTheirProfile) return true

  return false
}

/**
 * Reduces multiple sequential newlines (> 3) into max `\n\n` and
 * trims both leading and trailing newlines
 * @param {string} str
 */
export const squashNewLines = (str: Nullable<string>) => {
  return str ? str.replace(/\n\s*\n\s*\n/g, '\n\n').trim() : str
}
