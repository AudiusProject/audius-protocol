import { useCallback, useContext } from 'react'

import {
  FeatureFlags,
  notificationsSelectors,
  notificationsActions
} from '@audius/common'
import type { ParamListBase, RouteProp } from '@react-navigation/core'
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp
} from '@react-navigation/native-stack'
import { CardStyleInterpolators } from '@react-navigation/stack'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import AudiusLogo from 'app/assets/images/audiusLogoHorizontal.svg'
import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import IconNotification from 'app/assets/images/iconNotification.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import { IconButton } from 'app/components/core'
import type { ContextualParams } from 'app/hooks/useNavigation'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { NotificationsDrawerNavigationContext } from 'app/screens/notifications-screen/NotificationsDrawerNavigationContext'
import { makeStyles } from 'app/styles'
import { formatCount } from 'app/utils/format'
import { useThemeColors } from 'app/utils/theme'

import type { AppScreenParamList } from './AppScreen'
import type { AppTabScreenParamList } from './AppTabScreen'
const { markAllAsViewed } = notificationsActions
const { getNotificationUnviewedCount } = notificationsSelectors

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  headerLeft: { marginLeft: spacing(-2), width: 40 },
  headerRight: {},
  title: {
    fontSize: 18,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight5,
    textTransform: 'uppercase'
  },
  iconNotification: {
    height: 28,
    width: 28
  },
  notificationCount: {
    position: 'absolute',
    left: 14,
    borderRadius: 8,
    backgroundColor: palette.accentRed,
    paddingHorizontal: 6
  },
  notificationCountText: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: 11,
    textAlign: 'center',
    color: palette.staticWhite
  },
  iconArrowBack: {
    height: 28,
    width: 28,
    transform: [{ rotate: '180deg' }]
  },
  audiusLogo: {
    height: 24,
    width: 93,
    marginRight: 10
  },
  iconSearch: {
    height: 18,
    width: 18
  },
  earlyAccess: {
    fontSize: 10,
    position: 'absolute',
    fontFamily: typography.fontByWeight.bold,
    color: palette.primary,
    letterSpacing: 0.5,
    left: 30,
    top: 18,
    width: 72
  }
}))

const messages = {
  earlyAccess: 'Early Access'
}

export const useAppScreenOptions = (
  overrides?: Partial<NativeStackNavigationOptions>
) => {
  const styles = useStyles()
  const { accentOrangeLight1, neutralLight4 } = useThemeColors()
  const dispatch = useDispatch()
  const notificationCount = useSelector(getNotificationUnviewedCount)
  const navigation = useNavigation<
    AppScreenParamList & AppTabScreenParamList['Search']
  >()
  const { drawerHelpers } = useContext(NotificationsDrawerNavigationContext)

  const handlePressNotification = useCallback(() => {
    drawerHelpers?.openDrawer()
    dispatch(markAllAsViewed())
  }, [dispatch, drawerHelpers])

  const handlePressHome = useCallback(() => {
    navigation.navigate('trending')
  }, [navigation])

  const handlePressSearch = useCallback(() => {
    navigation.push('Search')
  }, [navigation])

  const { isEnabled: isEarlyAccess } = useFeatureFlag(FeatureFlags.EARLY_ACCESS)

  const screenOptions: (options: {
    navigation: NativeStackNavigationProp<AppScreenParamList>
    route: RouteProp<ParamListBase>
  }) => NativeStackNavigationOptions = useCallback(
    ({ navigation, route }) => {
      // The manual typing is unfortunate here. There may be a better way, but
      // the tricky bit is that StackNavigationOptions aren't known to the RouteProp.
      // A better solution may be to wrap <Stack.Screen> in our own variant that
      // can do some better generics & inference.
      const params = route.params
      // Notifications uses this in order to remove animations when going from the drawer
      // to a nested stack screen.
      const isFromNotifs =
        params &&
        'fromNotifications' in params &&
        (params as ContextualParams).fromNotifications

      return {
        animation: isFromNotifs ? 'none' : 'default',
        gestureEnabled: !isFromNotifs,
        fullScreenGestureEnabled: true,
        detachPreviousScreen: false,
        cardOverlayEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerBackVisible: false,
        headerLeft: (props) => {
          const { canGoBack, ...other } = props
          if (canGoBack) {
            return (
              <View style={styles.headerLeft}>
                <IconButton
                  icon={IconCaretRight}
                  fill={neutralLight4}
                  styles={{ icon: styles.iconArrowBack }}
                  {...other}
                  onPress={() => {
                    if (isFromNotifs) {
                      drawerHelpers?.openDrawer()
                    }

                    navigation.goBack()
                  }}
                />
              </View>
            )
          }
          return (
            <View style={styles.headerLeft}>
              <IconButton
                icon={IconNotification}
                styles={{ icon: styles.iconNotification }}
                fill={
                  notificationCount > 0 ? accentOrangeLight1 : neutralLight4
                }
                onPress={handlePressNotification}
              />
              {notificationCount > 0 ? (
                <View style={styles.notificationCount}>
                  <Text style={styles.notificationCountText}>
                    {formatCount(notificationCount)}
                  </Text>
                </View>
              ) : null}
            </View>
          )
        },
        title: '',
        headerTitle: ({ children }) => {
          if (children === 'none') return null
          if (children) {
            return (
              <Text style={styles.title} accessibilityRole='header'>
                {children}
              </Text>
            )
          }
          return (
            <View>
              <IconButton
                icon={AudiusLogo}
                fill={neutralLight4}
                styles={{ icon: styles.audiusLogo }}
                onPress={handlePressHome}
              />
              {isEarlyAccess ? (
                <Text style={styles.earlyAccess}>{messages.earlyAccess}</Text>
              ) : null}
            </View>
          )
        },
        headerRightContainerStyle: styles.headerRight,
        headerRight: () => {
          return (
            <View style={styles.headerRight}>
              <IconButton
                icon={IconSearch}
                fill={neutralLight4}
                styles={{ icon: styles.iconSearch }}
                onPress={handlePressSearch}
              />
            </View>
          )
        },
        ...overrides
      }
    },
    [
      drawerHelpers,
      handlePressNotification,
      handlePressHome,
      handlePressSearch,
      styles,
      neutralLight4,
      accentOrangeLight1,
      notificationCount,
      overrides,
      isEarlyAccess
    ]
  )

  return screenOptions
}
