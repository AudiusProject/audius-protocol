import { useCallback } from 'react'

import { notificationsSelectors } from '@audius/common'
import { Pressable, View, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'

import IconNotification from 'app/assets/images/iconNotification.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { BOTTOM_BAR_BUTTON_HEIGHT } from '../constants'

const { getNotificationUnviewedCount } = notificationsSelectors

export type BaseBottomTabBarButtonProps = {
  isActive: boolean
  onPress: (isActive: boolean, routeName: string, routeKey: string) => void
  onLongPress: () => void
  routeKey: string
}

export type NotificationsButtonProps = BaseBottomTabBarButtonProps & {
  name: string
}

const useStyles = makeStyles(({ palette, typography }) => ({
  animatedButton: {
    width: '20%',
    alignItems: 'center'
  },
  iconWrapper: {
    height: BOTTOM_BAR_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  underlay: {
    width: '100%',
    height: BOTTOM_BAR_BUTTON_HEIGHT,
    position: 'absolute'
  },
  notificationCount: {
    position: 'absolute',
    right: -6,
    top: 4,
    borderRadius: 99,
    minHeight: 20,
    minWidth: 20,
    backgroundColor: palette.secondary,
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: palette.white
  },
  notificationCountText: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    color: palette.staticWhite
  }
}))

// Temporary component for notification bottom-button until we get a lottie animation
export const NotificationsButton = (props: NotificationsButtonProps) => {
  const { routeKey, isActive, onPress, onLongPress } = props
  const name = 'notifications'
  const styles = useStyles()
  const { primary, neutral, neutralLight8, neutralLight10 } = useThemeColors()
  const notificationCount = useSelector(getNotificationUnviewedCount)

  const handlePress = useCallback(() => {
    onPress(isActive, name, routeKey)
  }, [onPress, routeKey, isActive, name])

  return (
    <Pressable
      style={styles.animatedButton}
      onPress={handlePress}
      onLongPress={onLongPress}
    >
      {({ pressed }) => (
        <>
          {pressed ? (
            <LinearGradient
              style={styles.underlay}
              colors={[neutralLight8, neutralLight10]}
            />
          ) : null}
          <View style={styles.iconWrapper}>
            <IconNotification
              height={32}
              width={32}
              fill={pressed || isActive ? primary : neutral}
            />
            {notificationCount > 0 ? (
              <View style={styles.notificationCount}>
                <Text style={styles.notificationCountText}>
                  {notificationCount >= 100 ? '99+' : notificationCount}
                </Text>
              </View>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  )
}
