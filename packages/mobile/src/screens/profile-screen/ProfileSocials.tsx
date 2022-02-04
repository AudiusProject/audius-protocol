import { ProfileUser } from 'audius-client/src/pages/profile-page/store/types'
import { View } from 'react-native'

import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { makeStyles } from 'app/styles/makeStyles'
import { useThemeColors } from 'app/utils/theme'

import { ProfileBadge } from './ProfileBadge'

const useStyles = makeStyles(({ palette, spacing }) => ({
  socials: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    height: 20,
    width: 20,
    marginRight: spacing(4),
    fill: palette.neutral
  }
}))

type ProfileSocialsProps = {
  profile: ProfileUser
}

export const ProfileSocials = ({ profile }: ProfileSocialsProps) => {
  const { twitter_handle, instagram_handle } = profile
  const styles = useStyles()
  const { neutral } = useThemeColors()
  return (
    <View style={styles.socials}>
      <ProfileBadge profile={profile} />
      {!twitter_handle ? (
        <IconTwitterBird style={styles.icon} fill={neutral} />
      ) : null}
      {!instagram_handle ? <IconInstagram style={styles.icon} /> : null}
    </View>
  )
}
