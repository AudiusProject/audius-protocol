import type { ComponentType } from 'react'

import type { User } from '@audius/common/models'
import { useTierAndVerifiedForUser } from '@audius/common/store'
import type { ViewStyle, StyleProp, TextStyle } from 'react-native'
import { StyleSheet, View, Text } from 'react-native'

import { IconVerified } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { useThemePalette } from 'app/utils/theme'

type UserBadgesProps = {
  user: Pick<User, 'user_id' | 'name' | 'is_verified'> | undefined
  badgeSize?: number
  style?: StyleProp<ViewStyle>
  nameStyle?: StyleProp<TextStyle>
  hideName?: boolean
  as?: ComponentType
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
  const {
    user,
    badgeSize = 14,
    style,
    nameStyle,
    hideName,
    as: Component = View
  } = props
  const { tier } = useTierAndVerifiedForUser(user?.user_id)
  const palette = useThemePalette()

  if (!user) return null

  return (
    <Component style={[styles.container, style]}>
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
          fill={palette.staticPrimary}
        />
      ) : null}
      <IconAudioBadge tier={tier} style={styles.badge} size='xs' />
    </Component>
  )
}

export default UserBadges
