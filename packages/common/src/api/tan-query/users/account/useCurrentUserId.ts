import { useCurrentAccount } from './useCurrentAccount'

/**
 * Hook to get the currently logged in user's ID
 */
export const useCurrentUserId = () => {
  return useCurrentAccount({
    select: (account) => account?.userId
  })
}
