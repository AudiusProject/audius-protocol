import { useCallback } from 'react'

import { LayoutAnimation, View } from 'react-native'
import { useToggle } from 'react-use'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import { TopBarIconButton } from 'app/components/app-navigator/TopBarIconButton'
import { ProfileStackParamList } from 'app/components/app-navigator/types'
import { Screen, VirtualizedScrollView } from 'app/components/core'
import { ProfilePhoto } from 'app/components/user'
import { useAccountUser, useProfile } from 'app/hooks/selectors'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles/makeStyles'
import { useThemeColors } from 'app/utils/theme'

import { ArtistRecommendations } from './ArtistRecommendations/ArtistRecommendations'
import { CoverPhoto } from './CoverPhoto'
import { ExpandableBio } from './ExpandableBio'
import { ProfileInfo } from './ProfileInfo'
import { ProfileMetrics } from './ProfileMetrics'
import { ProfileSocials } from './ProfileSocials'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { UploadTrackButton } from './UploadTrackButton'

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
  },
  topBarIcons: {
    flexDirection: 'row'
  },
  iconCrown: {
    marginLeft: 4
  }
}))

export const ProfileScreen = () => {
  const styles = useStyles()
  const profile = useProfile()
  const accountUser = useAccountUser()

  const [hasUserFollowed, setHasUserFollowed] = useToggle(false)
  const { accentOrange } = useThemeColors()

  const navigation = useNavigation<ProfileStackParamList>()

  const handleNavigateSettings = useCallback(() => {
    navigation.push({
      native: { screen: 'SettingsScreen', params: undefined },
      web: { route: '/settings' }
    })
  }, [navigation])

  const handleNavigateAudio = useCallback(() => {
    navigation.push({
      native: { screen: 'AudioScreen', params: undefined },
      web: { route: '/audio ' }
    })
  }, [navigation])

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
    <View style={styles.topBarIcons}>
      <TopBarIconButton icon={IconSettings} onPress={handleNavigateSettings} />
      <View style={styles.iconCrown}>
        <TopBarIconButton
          fill={accentOrange}
          icon={IconCrown}
          onPress={handleNavigateAudio}
        />
      </View>
    </View>
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
          {!isOwner ? null : <UploadTrackButton />}
        </View>
        <View style={styles.navigator}>
          <ProfileTabNavigator profile={profile} />
        </View>
      </VirtualizedScrollView>
    </Screen>
  )
}
