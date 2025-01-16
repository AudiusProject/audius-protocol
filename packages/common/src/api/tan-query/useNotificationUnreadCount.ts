import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { useAudiusQueryContext } from '~/audius-query'
import { useRemoteVar } from '~/hooks/useRemoteVar'
import { getBalance } from '~/store/wallet/slice'

import { Id } from '../../models/Identifiers'
import { IntKeys } from '../../services/remote-config'

import { useCurrentUserId } from './useCurrentUserId'
import { useNotificationValidTypes } from './useNotificationValidTypes'

const QUERY_KEYS = {
  NOTIFICATION_UNREAD_COUNT: 'NOTIFICATION_UNREAD_COUNT'
} as const

/**
 * Hook that returns the number of unread notifications for the current user.
 * Uses the notifications endpoint with limit 0 to just get the count.
 * Polls based on the NOTIFICATION_POLLING_FREQ_MS remote config value.
 */
export const useNotificationUnreadCount = () => {
  const dispatch = useDispatch()
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const pollingFreqMs = useRemoteVar(IntKeys.NOTIFICATION_POLLING_FREQ_MS)
  const validTypes = useNotificationValidTypes()

  const query = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT, currentUserId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.notifications.getNotifications({
        userId: Id.parse(currentUserId),
        limit: 0,
        validTypes
      })
      return data?.unreadCount ?? 0
    },
    refetchInterval: pollingFreqMs,
    enabled: !!currentUserId
  })

  // When notitifation count increases, update the balance
  const { data: count } = query
  const prevCount = usePrevious(count)
  useEffect(() => {
    if (prevCount !== undefined && count !== undefined && count > prevCount) {
      dispatch(getBalance())
    }
  }, [count, prevCount, dispatch])

  return query
}
