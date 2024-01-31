import { useCallback, useContext } from 'react'

import { FeatureFlags } from '@audius/common'
import type { ParamListBase, RouteProp } from '@react-navigation/core'
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp
} from '@react-navigation/native-stack'
import { CardStyleInterpolators } from '@react-navigation/stack'
import { Text, View } from 'react-native'

import { IconCaretLeft, IconSearch } from '@audius/harmony-native'
import AudiusLogo from 'app/assets/images/audiusLogoHorizontalDeprecated.svg'
import { IconButton } from 'app/components/core'
import type { ContextualParams } from 'app/hooks/useNavigation'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { AppDrawerContext } from '../app-drawer-screen'

import { AccountPictureHeader } from './AccountPictureHeader'
import type { AppTabScreenParamList } from './AppTabScreen'
import type { AppScreenParamList } from './AppTabsScreen'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  headerLeft: { marginLeft: spacing(-2) + 1, width: 40 },
  headerRight: {},
  title: {
    fontSize: 18,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight5,
    textTransform: 'uppercase'
  },
  iconArrowBack: {
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

type ParamList = AppScreenParamList & Pick<AppTabScreenParamList, 'Search'>

type Options = {
  navigation: NativeStackNavigationProp<ParamList>
  route: RouteProp<ParamListBase>
}

export const useAppScreenOptions = (
  overrides?: Partial<NativeStackNavigationOptions>
) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation()
  const { drawerHelpers } = useContext(AppDrawerContext)

  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  const handlePressHome = useCallback(() => {
    navigation.navigate('trending')
  }, [navigation])

  const handlePressSearch = useCallback(() => {
    navigation.navigate('Search')
  }, [navigation])

  const { isEnabled: isEarlyAccess } = useFeatureFlag(FeatureFlags.EARLY_ACCESS)

  const screenOptions: (options: Options) => NativeStackNavigationOptions =
    useCallback(
      (options) => {
        const { navigation, route } = options
        const { params } = route
        const isFromAppLeftDrawer =
          params && (params as ContextualParams).fromAppDrawer

        return {
          animation: isFromAppLeftDrawer ? 'none' : 'default',
          fullScreenGestureEnabled: true,
          freezeOnBlur: true,
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
                    icon={IconCaretLeft}
                    fill={neutralLight4}
                    styles={{ icon: styles.iconArrowBack }}
                    {...other}
                    onPress={navigation.goBack}
                  />
                </View>
              )
            }
            return (
              <View style={[styles.headerLeft, { marginLeft: 0 }]}>
                <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />
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
        handleOpenLeftNavDrawer,
        handlePressHome,
        handlePressSearch,
        styles,
        neutralLight4,
        overrides,
        isEarlyAccess
      ]
    )

  return screenOptions
}
