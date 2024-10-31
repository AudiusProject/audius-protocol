import { useCallback } from 'react'

import {
  notificationsActions,
  notificationsSelectors
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { IconNotificationOn } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'

import { NotificationList } from './NotificationList'
const { markAllAsViewed } = notificationsActions
const { getNotificationUnviewedCount } = notificationsSelectors

const messages = {
  header: 'Notifications'
}

export const NotificationsScreen = () => {
  useAppTabScreen()
  const dispatch = useDispatch()
  const totalUnviewed = useSelector(getNotificationUnviewedCount)

  const handleMarkAsViewed = useCallback(() => {
    if (totalUnviewed > 0) {
      return () => {
        dispatch(markAllAsViewed())
      }
    }
  }, [dispatch, totalUnviewed])

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
