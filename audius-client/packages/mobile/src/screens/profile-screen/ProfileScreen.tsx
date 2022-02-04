import { Dimensions, Text, View } from 'react-native'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles/makeStyles'

import { CoverPhoto } from './CoverPhoto'
import { ExpandableBio } from './ExpandableBio'
import { ProfileMetrics } from './ProfileMetrics'
import { ProfilePhoto } from './ProfilePhoto'
import { ProfileSocials } from './ProfileSocials'
import { ProfileTabNavigator } from './ProfileTabNavigator'
import { getProfile } from './selectors'

const screenHeight = Dimensions.get('window').height

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  screen: {
    display: 'flex',
    flexDirection: 'column',
    height: screenHeight
  },
  header: {
    backgroundColor: palette.white,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3)
  },
  username: {
    ...typography.h1,
    color: palette.neutral
  },
  handle: {
    ...typography.h2,
    color: palette.neutralLight4,
    marginBottom: spacing(4)
  }
}))

const ProfileScreen = () => {
  const styles = useStyles()
  const { profile } = useSelectorWeb(getProfile)

  if (!profile) return null

  return (
    <View style={styles.screen}>
      <CoverPhoto profile={profile} />
      <ProfilePhoto profile={profile} />
      <View style={styles.header}>
        <Text accessibilityRole='header' style={styles.username}>
          {profile.name}
        </Text>
        <Text style={styles.handle}>@{profile.handle}</Text>
        <ProfileMetrics profile={profile} />
        <ProfileSocials profile={profile} />
        <ExpandableBio profile={profile} />
      </View>
      <View style={{ flex: 4 }}>
        <ProfileTabNavigator profile={profile} />
      </View>
    </View>
  )
}

export default ProfileScreen
