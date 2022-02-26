import { User } from 'audius-client/src/common/models/User'
import { Pressable } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'

type ArtistLinkProps = {
  artist: User
}

export const ArtistLink = (props: ArtistLinkProps) => {
  const { artist } = props
  const { name } = artist

  return (
    <Pressable style={{ flexDirection: 'row' }}>
      <Text color='secondary' variant='h3'>
        {name}
      </Text>
      <UserBadges user={artist} hideName badgeSize={8} />
    </Pressable>
  )
}
