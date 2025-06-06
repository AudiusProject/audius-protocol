import { useCurrentAccount } from './useCurrentAccount'

/**
 * Hook to get the currently logged in user's ID
 */
export const useCurrentUserId = () => {
  const { data: currentUserId } = useCurrentAccount({
    select: (account) => account?.userId
  })
  return { data: currentUserId }
}
