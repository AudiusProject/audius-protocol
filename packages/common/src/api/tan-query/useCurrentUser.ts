import { useSelector } from 'react-redux'

import { getUserId } from '~/store/account/selectors'

import { useUser } from './useUser'
import type { Config } from './useUser'

/**
 * Hook to get the currently logged in user's data
 */
export const useCurrentUser = (config?: Config) => {
  const currentUserId = useSelector(getUserId)
  return useUser(currentUserId, {
    ...config,
    enabled: config?.enabled !== false && !!currentUserId
  })
}
