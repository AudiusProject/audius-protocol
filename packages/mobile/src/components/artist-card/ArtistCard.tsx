import { useCallback } from 'react'

import type { User } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { UserImage } from 'app/components/image/UserImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { formatCount } from 'app/utils/format'

const formatProfileCardSecondaryText = (followers: number) => {
  const followersText = followers === 1 ? 'Follower' : 'Followers'
  return `${formatCount(followers)} ${followersText}`
}

type ArtistCardProps = {
  artist: User
  style?: StyleProp<ViewStyle>
}

export const ArtistCard = ({ artist, style }: ArtistCardProps) => {
  const { handle } = artist
  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    navigation.push('Profile', { handle })
  }, [navigation, handle])

  const renderImage = useCallback(() => <UserImage user={artist} />, [artist])

  return (
    <Card
      style={style}
      renderImage={renderImage}
      primaryText={artist.name}
      secondaryText={formatProfileCardSecondaryText(artist.follower_count)}
      onPress={handlePress}
      type='user'
      user={artist}
    />
  )
}
