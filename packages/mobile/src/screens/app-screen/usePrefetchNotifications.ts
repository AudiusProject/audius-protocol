import { useEffect, useState } from 'react'

import { useNotifications } from '@audius/common/api'

export const usePrefetchNotifications = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNotificationsEnabled(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  useNotifications({ enabled: isNotificationsEnabled })
}
