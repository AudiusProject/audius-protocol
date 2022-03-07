import { useCallback, useMemo } from 'react'

import {
  CardStyleInterpolators,
  StackNavigationOptions
} from '@react-navigation/stack'
import { markAllAsViewed } from 'audius-client/src/components/notification/store/actions'
import { Platform, Text } from 'react-native'
import { useDispatch } from 'react-redux'

import AudiusLogo from 'app/assets/images/audiusLogoHorizontal.svg'
import IconNotification from 'app/assets/images/iconNotification.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { open as openNotificationPanel } from 'app/store/notifications/actions'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { IconButton } from '../core'

import { TopBarArrowBack } from './TopBarArrowBack'
import { MainParamList, SearchParamList } from './types'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    height: Platform.OS === 'ios' ? 86 : 55,
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight9,
    backgroundColor: palette.white,
    zIndex: 15
  },
  headerLeft: { paddingLeft: spacing(2), width: 40 },
  headerRight: { paddingRight: spacing(3) },
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
  audiusLogo: {
    height: 24,
    width: 93,
    marginRight: 10
  },
  iconSearch: {
    height: 18,
    width: 18
  }
}))

export const useScreenOptions = () => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation<MainParamList & SearchParamList>()

  const handlePressNotification = useCallback(() => {
    dispatch(openNotificationPanel())
    dispatchWeb(markAllAsViewed())
  }, [dispatch, dispatchWeb])

  const handlePressHome = useCallback(() => {
    navigation.navigate({
      native: { screen: 'trending', params: undefined },
      web: { route: 'trending' }
    })
  }, [navigation])

  const handlePressSearch = useCallback(() => {
    navigation.push({
      native: { screen: 'Search', params: undefined }
    })
  }, [navigation])

  const screenOptions: StackNavigationOptions = useMemo(
    () => ({
      cardOverlayEnabled: true,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      gestureEnabled: true,
      gestureResponseDistance: 1000,
      headerLeftContainerStyle: styles.headerLeft,
      headerLeft: props => {
        const { canGoBack, ...other } = props
        if (canGoBack) {
          return <TopBarArrowBack {...other} />
        }
        return (
          <IconButton
            icon={IconNotification}
            styles={{ icon: styles.iconNotification }}
            fill={neutralLight4}
            onPress={handlePressNotification}
          />
        )
      },
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
          <IconButton
            icon={AudiusLogo}
            fill={neutralLight4}
            styles={{ icon: styles.audiusLogo }}
            onPress={handlePressHome}
          />
        )
      },
      headerRightContainerStyle: styles.headerRight,
      headerRight: () => {
        return (
          <IconButton
            icon={IconSearch}
            fill={neutralLight4}
            styles={{ icon: styles.iconSearch }}
            onPress={handlePressSearch}
          />
        )
      }
    }),
    [
      handlePressNotification,
      handlePressHome,
      handlePressSearch,
      styles,
      neutralLight4
    ]
  )

  return screenOptions
}
