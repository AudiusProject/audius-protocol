import { useCallback, useContext, useEffect } from 'react'

import { useDrawerStatus } from '@react-navigation/drawer'
import { markAllAsViewed } from 'audius-client/src/common/store/notifications/actions'
import { StyleSheet, View } from 'react-native'
import { usePrevious } from 'react-use'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useTheme } from 'app/utils/theme'

import { List } from './List'
import { NotificationsDrawerNavigationContext } from './NotificationsDrawerNavigationContext'
import TopBar from './TopBar'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%'
  }
})

/**
 * A component that renders a user's notifications
 */
export const NotificationsScreen = () => {
  const dispatchWeb = useDispatchWeb()
  const { drawerNavigation } = useContext(NotificationsDrawerNavigationContext)
  const isDrawerOpen = useDrawerStatus() === 'open'
  const wasDrawerOpen = usePrevious(isDrawerOpen)
  useEffect(() => {
    if (wasDrawerOpen && !isDrawerOpen) {
      dispatchWeb(markAllAsViewed())
    }
  }, [isDrawerOpen, wasDrawerOpen, dispatchWeb])

  const onClickTopBarClose = useCallback(() => {
    drawerNavigation?.closeDrawer()
  }, [drawerNavigation])

  const containerStyle = useTheme(styles.container, {
    backgroundColor: 'background'
  })

  return (
    <View style={containerStyle}>
      <TopBar onClose={onClickTopBarClose} />
      <List />
    </View>
  )
}
