import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'

import { useCurrentUserId } from './useCurrentUserId'
import {
  getNotificationUnreadCountQueryKey,
  useNotificationUnreadCount
} from './useNotificationUnreadCount'

/**
 * Hook to mark all notifications as viewed
 */
export const useMarkNotificationsAsViewed = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const { data: unreadCount } = useNotificationUnreadCount()

  return useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('User ID is required')
      if (unreadCount === 0) return
      const sdk = await audiusSdk()
      await sdk.notifications.markAllNotificationsAsViewed({
        userId: Id.parse(currentUserId)
      })
    },
    onMutate: () => {
      // Optimistically set unread count to 0
      queryClient.setQueryData(
        getNotificationUnreadCountQueryKey(currentUserId),
        0
      )
    }
  })
}
