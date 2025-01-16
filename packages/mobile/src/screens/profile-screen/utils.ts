import type { CommonState } from '@audius/common/store'
import { useSelector } from 'react-redux'

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
    handle,
    has_collectibles,
    collectibleList,
    solanaCollectibleList,
    collectibles
  } = useSelectProfile([
    'handle',
    'user_id',
    'has_collectibles',
    'collectibleList',
    'solanaCollectibleList',
    'collectibles'
  ])
  const isOwner = useSelector((state: CommonState) => getIsOwner(state, handle))

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
