import { memo, useEffect } from 'react'

import { notificationsActions } from '@audius/common'
import { useDrawerStatus } from '@react-navigation/drawer'
import { View } from 'react-native'
import { usePrevious } from 'react-use'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'

import { NotificationList } from './NotificationList'
import { TopBar } from './TopBar'
const { markAllAsViewed } = notificationsActions

const useStyles = makeStyles(({ palette }) => ({
  root: {
    backgroundColor: palette.background,
    height: '100%'
  }
}))

/**
 * Memoized to prevent rerender during bottom-bar navigation.
 * It's rerendering because navigation context changes.
 */
export const NotificationsScreen = memo(() => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const isDrawerOpen = useDrawerStatus() === 'open'
  const wasDrawerOpen = usePrevious(isDrawerOpen)

  useEffect(() => {
    if (wasDrawerOpen && !isDrawerOpen) {
      dispatchWeb(markAllAsViewed())
    }
  }, [isDrawerOpen, wasDrawerOpen, dispatchWeb])

  return (
    <View style={styles.root}>
      <TopBar />
      <NotificationList />
    </View>
  )
})
