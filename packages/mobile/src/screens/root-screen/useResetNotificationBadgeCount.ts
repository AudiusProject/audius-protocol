import { useCallback } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { useAudiusQueryContext } from '@audius/common/audius-query'

import { useEnterForeground } from 'app/hooks/useAppState'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'

import PushNotifications from '../../notifications'

export const useResetNotificationBadgeCount = () => {
  const { data: currentUserId } = useCurrentUserId()
  const { audiusSdk } = useAudiusQueryContext()

  useEnterForeground(
    useCallback(async () => {
      try {
        if (currentUserId) {
          PushNotifications.setBadgeCount(0)
          const sdk = await audiusSdk()
          await audiusBackendInstance.clearNotificationBadges({
            sdk
          })
        }
      } catch (error) {
        console.error(error)
      }
    }, [currentUserId, audiusSdk])
  )
}
