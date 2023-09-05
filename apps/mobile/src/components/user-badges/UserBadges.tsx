import { useSelectTierInfo } from '@audius/common'
import type { User } from '@audius/common'
import type { ViewStyle, StyleProp, TextStyle } from 'react-native'
import { StyleSheet, View, Text } from 'react-native'

import IconVerified from 'app/assets/images/iconVerified.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'

type UserBadgesProps = {
  user: Pick<User, 'user_id' | 'name' | 'is_verified'>
  badgeSize?: number
  style?: StyleProp<ViewStyle>
  nameStyle?: StyleProp<TextStyle>
  hideName?: boolean
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  badge: {
    marginLeft: 4
  }
})

export const UserBadges = (props: UserBadgesProps) => {
  const { user, badgeSize = 14, style, nameStyle, hideName } = props
  const { tier } = useSelectTierInfo(user.user_id)

  return (
    <View style={[styles.container, style]}>
      {hideName ? null : (
        <Text style={nameStyle} numberOfLines={1}>
          {user.name}
        </Text>
      )}
      {user.is_verified ? (
        <IconVerified
          height={badgeSize}
          width={badgeSize}
          style={styles.badge}
        />
      ) : null}
      <IconAudioBadge
        tier={tier}
        style={styles.badge}
        height={badgeSize + 2}
        width={badgeSize + 2}
      />
    </View>
  )
}

export default UserBadges
