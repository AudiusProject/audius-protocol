import { useCallback, useEffect, useRef, useState } from 'react'

import { Status, ShareSource } from '@audius/common'
import { PortalHost } from '@gorhom/portal'
import { FeatureFlags } from 'audius-client/src/common/services/remote-config'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { fetchProfile } from 'audius-client/src/common/store/pages/profile/actions'
import { getProfileStatus } from 'audius-client/src/common/store/pages/profile/selectors'
import { requestOpen as requestOpenShareModal } from 'audius-client/src/common/store/ui/share-modal/slice'
import { Animated, View } from 'react-native'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton, Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { TopBarIconButton } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles/makeStyles'
import { useThemeColors } from 'app/utils/theme'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { ProfileHeader } from './ProfileHeader'
import { ProfileHeaderV2 } from './ProfileHeaderV2'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { useSelectProfileRoot } from './selectors'

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
  const profile = useSelectProfileRoot(['user_id', 'does_current_user_follow'])
  const accountId = useSelectorWeb(getUserId)
  const dispatchWeb = useDispatchWeb()
  const status = useSelectorWeb(getProfileStatus)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { neutralLight4, accentOrange } = useThemeColors()
  const navigation = useNavigation<ProfileTabScreenParamList>()
  const { isEnabled: isTippingEnabled } = useFeatureFlag(
    FeatureFlags.TIPPING_ENABLED
  )

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
      dispatchWeb(
        requestOpenShareModal({
          type: 'profile',
          profileId: profile.user_id,
          source: ShareSource.PAGE
        })
      )
    }
  }, [profile, dispatchWeb])

  const handleRefresh = useCallback(() => {
    if (profile) {
      setIsRefreshing(true)
      const { handle, user_id } = profile
      dispatchWeb(fetchProfile(handle, user_id, true, true, false))
    }
  }, [profile, dispatchWeb])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setIsRefreshing(false)
    }
  }, [status])

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

  const renderHeader = useCallback(() => {
    return isTippingEnabled ? (
      <ProfileHeaderV2 scrollY={scrollY} />
    ) : (
      <ProfileHeader scrollY={scrollY} />
    )
  }, [isTippingEnabled, scrollY])

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
