import {
  useCurrentUserId,
  useUserCollectibles,
  useProfileUser
} from '@audius/common/api'

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
  const { has_collectibles, collectibleList, solanaCollectibleList, user_id } =
    useProfileUser({
      select: (user) => ({
        handle: user.handle,
        user_id: user.user_id,
        has_collectibles: user.has_collectibles,
        collectibleList: user.collectibleList,
        solanaCollectibleList: user.solanaCollectibleList
      })
    }).user || {}
  const { data: accountUserId } = useCurrentUserId()
  const isOwner = accountUserId === user_id
  const { data: profileCollectibles } = useUserCollectibles({
    userId: user_id
  })

  const hasCollectibles =
    collectibleList?.length || solanaCollectibleList?.length
  const hasCollectiblesOrder = Boolean(profileCollectibles?.order?.length)
  const didCollectiblesLoadAndWasEmpty =
    hasCollectibles && !hasCollectiblesOrder

  if (has_collectibles && !didCollectiblesLoadAndWasEmpty) return true

  const neverSetCollectiblesOrder = !profileCollectibles
  const hasVisibleCollectibles =
    hasCollectibles && (neverSetCollectiblesOrder || hasCollectiblesOrder)

  if (hasVisibleCollectibles) return true

  if (hasCollectibles && isOwner) return true

  return false
}
