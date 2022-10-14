import { useCallback } from 'react'

import { notificationsActions } from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'

import { ScreenContent } from '../ScreenContent'

import { NotificationList } from './NotificationList'
const { markAllAsViewed } = notificationsActions

const messages = {
  header: 'Notifications'
}

export const NotificationsScreen = () => {
  usePopToTopOnDrawerOpen()
  const dispatch = useDispatch()

  useFocusEffect(
    useCallback(() => {
      dispatch(markAllAsViewed())
    }, [dispatch])
  )

  return (
    <Screen>
      <Header text={messages.header} />
      <ScreenContent>
        <NotificationList />
      </ScreenContent>
    </Screen>
  )
}
