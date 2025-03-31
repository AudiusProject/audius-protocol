import { useSelector } from 'react-redux'

import { getUserId } from '~/store/account/selectors'

/**
 * Hook to get the currently logged in user's ID
 */
export const useCurrentUserId = () => {
  const currentUserId = useSelector(getUserId)
  return { data: currentUserId }
}
