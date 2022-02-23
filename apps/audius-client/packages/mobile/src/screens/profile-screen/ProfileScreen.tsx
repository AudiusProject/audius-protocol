import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { View } from 'react-native'

import IconSettings from 'app/assets/images/iconSettings.svg'
import { TopBarIconButton } from 'app/components/app-navigator/TopBarIconButton'
import { Screen, VirtualizedScrollView } from 'app/components/core'
import { ProfilePhoto } from 'app/components/user'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles/makeStyles'

import { CoverPhoto } from './CoverPhoto'
import { ExpandableBio } from './ExpandableBio'
import { ProfileInfo } from './ProfileInfo'
import { ProfileMetrics } from './ProfileMetrics'
import { ProfileSocials } from './ProfileSocials'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { getProfile } from './selectors'

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.white,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3)
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    zIndex: 100
  }
}))

export const ProfileScreen = () => {
  const styles = useStyles()
  const { profile } = useSelectorWeb(getProfile)
  const accountUser = useSelectorWeb(getAccountUser)

  const navigation = useNavigation()

  const handleNavigateSettings = () => {
    navigation.push({
      native: { screen: 'SettingsScreen', params: undefined },
      web: { route: '/settings' }
    })
  }

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
          <ProfileInfo profile={profile} />
          <ProfileMetrics profile={profile} />
          <ProfileSocials profile={profile} />
          <ExpandableBio profile={profile} />
        </View>
        <View style={{ flex: 4 }}>
          <ProfileTabNavigator profile={profile} />
        </View>
      </VirtualizedScrollView>
    </Screen>
  )
}
