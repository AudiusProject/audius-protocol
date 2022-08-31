import { useCallback, useEffect, useRef, useState } from 'react'

import {
  Status,
  ShareSource,
  accountSelectors,
  profilePageSelectors,
  profilePageActions,
  shareModalUIActions
} from '@audius/common'
import { PortalHost } from '@gorhom/portal'
import { Animated, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { TopBarIconButton } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles/makeStyles'
import { useThemeColors } from 'app/utils/theme'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { ProfileHeader } from './ProfileHeader'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { useSelectProfile } from './selectors'
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { fetchProfile: fetchProfileAction } = profilePageActions
const { getProfileStatus } = profilePageSelectors
const getUserId = accountSelectors.getUserId

const useStyles = makeStyles(({ spacing }) => ({
  navigator: {
    height: '100%'
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing(-2)
  },
  iconCrownRoot: {
    marginLeft: spacing(1)
  },
  iconCrown: {
    height: 22,
    width: 22
  }
}))

export const ProfileScreen = () => {
  usePopToTopOnDrawerOpen()
  const styles = useStyles()
  const profile = useSelectProfile(['user_id', 'does_current_user_follow'])
  const { handle, user_id } = profile
  const accountId = useSelector(getUserId)
  const dispatch = useDispatch()
  const status = useSelector(getProfileStatus)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { neutralLight4, accentOrange } = useThemeColors()
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const fetchProfile = useCallback(
    () => dispatch(fetchProfileAction(handle, user_id, true, true, false)),
    [dispatch, handle, user_id]
  )

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleRefresh = useCallback(() => {
    if (profile) {
      setIsRefreshing(true)
      fetchProfile()
    }
  }, [profile, fetchProfile])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setIsRefreshing(false)
    }
  }, [status])

  const handlePressSettings = useCallback(() => {
    navigation.push({
      native: { screen: 'SettingsScreen' },
      web: { route: '/settings' }
    })
  }, [navigation])

  const handlePressAudio = useCallback(() => {
    navigation.push({
      native: { screen: 'AudioScreen' },
      web: { route: '/audio ' }
    })
  }, [navigation])

  const handlePressShare = useCallback(() => {
    if (profile) {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: profile.user_id,
          source: ShareSource.PAGE
        })
      )
    }
  }, [profile, dispatch])

  const isOwner = profile?.user_id === accountId

  const topbarLeft = isOwner ? (
    <View style={styles.topBarIcons}>
      <TopBarIconButton
        icon={IconSettings}
        onPress={handlePressSettings}
        hitSlop={{ right: 2 }}
      />
      <TopBarIconButton
        styles={{ root: styles.iconCrownRoot, icon: styles.iconCrown }}
        fill={accentOrange}
        icon={IconCrown}
        onPress={handlePressAudio}
        hitSlop={{ left: 2 }}
      />
    </View>
  ) : undefined

  const topbarRight = (
    <IconButton
      fill={neutralLight4}
      icon={IconShare}
      onPress={handlePressShare}
    />
  )

  const scrollY = useRef(new Animated.Value(0)).current

  const renderHeader = useCallback(
    () => <ProfileHeader scrollY={scrollY} />,
    [scrollY]
  )

  return (
    <Screen topbarLeft={topbarLeft} topbarRight={topbarRight}>
      {!profile ? null : (
        <>
          <View style={styles.navigator}>
            <PortalHost name='PullToRefreshPortalHost' />
            <ProfileTabNavigator
              renderHeader={renderHeader}
              animatedValue={scrollY}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          </View>
        </>
      )}
    </Screen>
  )
}
