import { useCallback } from 'react'

import { useMarkNotificationsAsViewed } from '@audius/common/api'
import { useFocusEffect } from '@react-navigation/native'

import { IconNotificationOn } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'

import { NotificationList } from './NotificationList'

const messages = {
  header: 'Notifications'
}

export const NotificationsScreen = () => {
  useAppTabScreen()
  const { mutate: markAsViewed } = useMarkNotificationsAsViewed()

  const handleMarkAsViewed = useCallback(() => {
    markAsViewed()
  }, [markAsViewed])

  useFocusEffect(handleMarkAsViewed)

  return (
    <Screen>
      <ScreenPrimaryContent>
        <ScreenHeader
          text={messages.header}
          icon={IconNotificationOn}
          iconProps={{ height: 28, width: 28 }}
        />
      </ScreenPrimaryContent>
      <ScreenContent>
        <ScreenSecondaryContent>
          <NotificationList />
        </ScreenSecondaryContent>
      </ScreenContent>
    </Screen>
  )
}
