import { View } from 'react-native'

import { VirtualizedScrollView } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles/makeStyles'

import { CoverPhoto } from './CoverPhoto'
import { ExpandableBio } from './ExpandableBio'
import { ProfileInfo } from './ProfileInfo'
import { ProfileMetrics } from './ProfileMetrics'
import { ProfilePhoto } from './ProfilePhoto'
import { ProfileSocials } from './ProfileSocials'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { getProfile } from './selectors'

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.white,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3)
  }
}))

const ProfileScreen = () => {
  const styles = useStyles()
  const { profile } = useSelectorWeb(getProfile)

  if (!profile) return null

  return (
    <VirtualizedScrollView listKey='profile-screen'>
      <CoverPhoto profile={profile} />
      <ProfilePhoto profile={profile} />
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
  )
}

export default ProfileScreen
