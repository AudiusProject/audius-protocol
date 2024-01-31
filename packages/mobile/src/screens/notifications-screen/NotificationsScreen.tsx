import { useCallback } from 'react'

import {
  notificationsActions,
  notificationsSelectors
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import IconNotification from 'app/assets/images/iconNotification.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
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
      <ScreenHeader
        text={messages.header}
        icon={IconNotification}
        iconProps={{ height: 28, width: 28 }}
      />
      <ScreenContent>
        <NotificationList />
      </ScreenContent>
    </Screen>
  )
}
