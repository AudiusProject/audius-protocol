import { badgeTiers } from 'audius-client/src/common/store/wallet/utils'

import { useSelectTierInfo } from 'app/hooks/useSelectTierInfo'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { MIN_COLLECTIBLES_TIER } from './constants'
import { getIsOwner, useSelectProfile } from './selectors'

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
export const useShouldShowCollectiblesTab = () => {
  const {
    user_id,
    has_collectibles,
    collectibleList,
    solanaCollectibleList,
    collectibles
  } = useSelectProfile([
    'user_id',
    'has_collectibles',
    'collectibleList',
    'solanaCollectibleList',
    'collectibles'
  ])
  const isOwner = useSelectorWeb(getIsOwner)
  const { tierNumber } = useSelectTierInfo(user_id)

  const hasCollectiblesTierRequirement =
    tierNumber >= badgeTiers.findIndex((t) => t.tier === MIN_COLLECTIBLES_TIER)

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

  if (hasVisibleCollectibles) return true

  if (hasCollectibles && isOwner) return true

  return false
}

/**
 * Reduces multiple sequential newlines (> 3) into max `\n\n` and
 * trims both leading and trailing newlines
 * @param {string} str
 */
export const squashNewLines = (str?: string) => {
  return str ? str.replace(/\n\s*\n\s*\n/g, '\n\n').trim() : ''
}
