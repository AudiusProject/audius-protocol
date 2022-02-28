import { useCallback } from 'react'

import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { LayoutAnimation, View } from 'react-native'
import { useToggle } from 'react-use'

import IconSettings from 'app/assets/images/iconSettings.svg'
import { TopBarIconButton } from 'app/components/app-navigator/TopBarIconButton'
import { Screen, VirtualizedScrollView } from 'app/components/core'
import { ProfilePhoto } from 'app/components/user'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles/makeStyles'

import { ArtistRecommendations } from './ArtistRecommendations/ArtistRecommendations'
import { CoverPhoto } from './CoverPhoto'
import { ExpandableBio } from './ExpandableBio'
import { ProfileInfo } from './ProfileInfo'
import { ProfileMetrics } from './ProfileMetrics'
import { ProfileSocials } from './ProfileSocials'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { getProfile } from './selectors'

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.neutralLight10,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(3)
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    zIndex: 100
  },
  navigator: {
    height: '100%'
  }
}))

export const ProfileScreen = () => {
  const styles = useStyles()
  const { profile } = useSelectorWeb(getProfile)
  const accountUser = useSelectorWeb(getAccountUser)
  const [hasUserFollowed, setHasUserFollowed] = useToggle(false)

  const navigation = useNavigation()

  const handleNavigateSettings = () => {
    navigation.push({
      native: { screen: 'SettingsScreen', params: undefined },
      web: { route: '/settings' }
    })
  }

  const handleFollow = useCallback(() => {
    if (!profile?.does_current_user_follow) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setHasUserFollowed(true)
    }
  }, [setHasUserFollowed, profile])

  const handleCloseArtistRecs = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setHasUserFollowed(false)
  }, [setHasUserFollowed])

  if (!profile) return null

  const isOwner = accountUser?.user_id === profile.user_id

  const topbarLeft = isOwner ? (
    <TopBarIconButton icon={IconSettings} onPress={handleNavigateSettings} />
  ) : undefined

  return (
    <Screen topbarLeft={topbarLeft}>
      <VirtualizedScrollView listKey='profile-screen'>
        <CoverPhoto profile={profile} />
        <ProfilePhoto style={styles.profilePicture} profile={profile} />
        <View style={styles.header}>
          <ProfileInfo profile={profile} onFollow={handleFollow} />
          <ProfileMetrics profile={profile} />
          <ProfileSocials profile={profile} />
          <ExpandableBio profile={profile} />
          {!hasUserFollowed ? null : (
            <ArtistRecommendations
              profile={profile}
              onClose={handleCloseArtistRecs}
            />
          )}
        </View>
        <View style={styles.navigator}>
          <ProfileTabNavigator profile={profile} />
        </View>
      </VirtualizedScrollView>
    </Screen>
  )
}
