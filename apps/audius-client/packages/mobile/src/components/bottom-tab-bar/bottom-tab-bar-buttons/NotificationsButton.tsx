import { useMemo } from 'react'

import { notificationsSelectors } from '@audius/common'
import { View, Text } from 'react-native'
import { useSelector } from 'react-redux'

import IconNotificationBase from 'app/assets/animations/iconNotifications.json'
import { makeStyles } from 'app/styles'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

const { getNotificationUnviewedCount } = notificationsSelectors

export type NotificationsButtonProps = BaseBottomTabBarButtonProps

const useStyles = makeStyles(({ palette, typography }) => ({
  notifBubble: {
    position: 'absolute',
    flex: 1,
    right: 20,
    top: 4,
    borderRadius: 99,
    minHeight: 20,
    minWidth: 20,
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

// Temporary component for notification bottom-button until we get a lottie animation
export const NotificationsButton = (props: NotificationsButtonProps) => {
  const styles = useStyles()
  const { primary, neutral } = useThemeColors()
  const notificationCount = useSelector(getNotificationUnviewedCount)

  const IconNotificationn = useMemo(
    () =>
      colorize(IconNotificationBase, {
        // Bell.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // Bell.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary,
        // Clapper.Group 1.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // Clapper.Group 1.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  return (
    <BottomTabBarButton
      name='notifications'
      iconJSON={IconNotificationn}
      {...props}
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
