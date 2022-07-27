import type { User } from '@audius/common'
import { TouchableOpacity } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import type { GestureResponderHandler } from 'app/types/gesture'

type ArtistLinkProps = {
  artist: User
  onPress: GestureResponderHandler
}

export const ArtistLink = (props: ArtistLinkProps) => {
  const { artist, onPress } = props
  const { name } = artist

  return (
    <TouchableOpacity style={{ flexDirection: 'row' }} onPress={onPress}>
      <Text color='secondary' variant='h3'>
        {name}
      </Text>
      <UserBadges user={artist} hideName badgeSize={8} />
    </TouchableOpacity>
  )
}
