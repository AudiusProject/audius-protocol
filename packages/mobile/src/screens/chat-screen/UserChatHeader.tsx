import type { User } from '@audius/common/models'
import { TouchableOpacity } from 'react-native'

import { ProfilePicture } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { AppTabScreenParamList } from '../app-screen'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  profileTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  userBadgeTitle: {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.bold,
    color: palette.neutral
  }
}))

export const UserChatHeader = ({ user }: { user: User }) => {
  const styles = useStyles()
  const navigation = useNavigation<AppTabScreenParamList>()
  return (
    <TouchableOpacity
      onPress={() => navigation.push('Profile', { id: user.user_id })}
      style={styles.profileTitle}
    >
      <ProfilePicture
        userId={user.user_id}
        size='small'
        mr='s'
        strokeWidth='thin'
      />
      <UserBadges user={user} nameStyle={styles.userBadgeTitle} />
    </TouchableOpacity>
  )
}
