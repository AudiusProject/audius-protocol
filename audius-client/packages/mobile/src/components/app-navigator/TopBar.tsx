import { memo, useCallback } from 'react'

import { StackHeaderProps } from '@react-navigation/stack'
import { markAllAsViewed } from 'audius-client/src/components/notification/store/actions'
import { Platform, View } from 'react-native'
import { useDispatch } from 'react-redux'

import AudiusLogo from 'app/assets/images/audiusLogoHorizontal.svg'
import IconNotification from 'app/assets/images/iconNotification.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { open as openNotificationPanel } from 'app/store/notifications/actions'
import { open as openSearch } from 'app/store/search/actions'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { IconButton } from '../core/IconButton'

import { TopBarArrowBack } from './TopBarArrowBack'

const useStyles = makeStyles(({ palette, spacing }) => ({
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
    height: spacing(6),
    width: spacing(20)
  },
  headerRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: spacing(6),
    width: spacing(20)
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

    const { headerLeft, headerRight } = options

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
      dispatch(openSearch())
    }, [dispatch])

    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            {headerLeft ? (
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
          <IconButton
            icon={AudiusLogo}
            fill={neutralLight4}
            styles={{ icon: styles.audiusLogo }}
            onPress={handlePressHome}
          />
          <View style={styles.headerRight}>
            {headerRight ? (
              headerRight({})
            ) : (
              <IconButton
                icon={IconSearch}
                fill={neutralLight4}
                styles={{ icon: styles.iconSearch }}
                onPress={handlePressSearch}
              />
            )}
          </View>
        </View>
      </View>
    )
  }
)
