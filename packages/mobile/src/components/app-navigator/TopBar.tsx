import { memo, useCallback } from 'react'

import { StackHeaderProps } from '@react-navigation/stack'
import { markAllAsViewed } from 'audius-client/src/components/notification/store/actions'
import { Platform, View, Text, Animated } from 'react-native'
import { useDispatch } from 'react-redux'

import AudiusLogo from 'app/assets/images/audiusLogoHorizontal.svg'
import IconNotification from 'app/assets/images/iconNotification.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { open as openNotificationPanel } from 'app/store/notifications/actions'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { IconButton } from '../core/IconButton'

import { TopBarArrowBack } from './TopBarArrowBack'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    height: Platform.OS === 'ios' ? 86 : 55,
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight9,
    backgroundColor: palette.white,
    zIndex: 15
  },
  topBar: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: 10,
    paddingRight: 20,
    marginBottom: spacing(1)
  },
  headerLeft: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: spacing(8)
  },
  headerRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: spacing(8)
  },
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

type TopBarProps = StackHeaderProps

export const TopBar = memo(
  ({ navigation: topBarNavigation, back, options }: TopBarProps) => {
    const styles = useStyles()

    const { neutralLight4 } = useThemeColors()
    const navigation = useNavigation()
    const dispatch = useDispatch()
    const dispatchWeb = useDispatchWeb()

    const {
      headerLeft,
      headerRight,
      title,
      headerRightContainerStyle
    } = options

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
      navigation.navigate({
        native: { screen: 'Search', params: undefined },
        web: { route: 'search' }
      })
    }, [navigation])

    const renderTitle = () => {
      if (title === null) return null
      if (title) {
        return (
          <Text style={styles.title} accessibilityRole='header'>
            {title}
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
    }

    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            {headerLeft !== undefined ? (
              headerLeft({})
            ) : back ? (
              <TopBarArrowBack onPress={topBarNavigation.goBack} />
            ) : (
              <IconButton
                icon={IconNotification}
                styles={{ icon: styles.iconNotification }}
                fill={neutralLight4}
                onPress={handlePressNotification}
              />
            )}
          </View>
          {renderTitle()}
          <Animated.View
            style={[styles.headerRight, headerRightContainerStyle]}
          >
            {headerRight !== undefined ? (
              headerRight({})
            ) : (
              <IconButton
                icon={IconSearch}
                fill={neutralLight4}
                styles={{ icon: styles.iconSearch }}
                onPress={handlePressSearch}
              />
            )}
          </Animated.View>
        </View>
      </View>
    )
  }
)
