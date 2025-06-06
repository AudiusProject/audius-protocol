import { useNotificationUnreadCount } from '@audius/common/api'
import { View, Text } from 'react-native'

import { makeStyles } from 'app/styles'

import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconNotifications from './animations/iconNotifications.lottie'

const colorKeypaths = ['Bell.Group 1.Fill 1', 'Clapper.Group 1.Fill 1']

type NotificationsButtonProps = BottomTabBarButtonProps

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  notifBubble: {
    position: 'absolute',
    flex: 1,
    right: spacing(5),
    top: spacing(1),
    borderRadius: 99,
    minHeight: spacing(5),
    minWidth: spacing(5),
    backgroundColor: palette.secondary,
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: palette.white
  },
  notifBubbleText: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    color: palette.staticWhite
  }
}))

export const NotificationsButton = (props: NotificationsButtonProps) => {
  const styles = useStyles()
  const { data: notificationCount = 0 } = useNotificationUnreadCount()

  return (
    <BottomTabBarButton
      {...props}
      name='notifications'
      source={iconNotifications}
      colorKeypaths={colorKeypaths}
    >
      {notificationCount > 0 ? (
        <View style={styles.notifBubble}>
          <Text style={styles.notifBubbleText}>
            {notificationCount >= 100 ? '99+' : notificationCount}
          </Text>
        </View>
      ) : null}
    </BottomTabBarButton>
  )
}
