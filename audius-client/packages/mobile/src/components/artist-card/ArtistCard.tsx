import { useCallback } from 'react'

import type { User } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { useNavigation } from 'app/hooks/useNavigation'
import { formatCount } from 'app/utils/format'

const formatProfileCardSecondaryText = (followers: number) => {
  const followersText = followers === 1 ? 'Follower' : 'Followers'
  return `${formatCount(followers)} ${followersText}`
}

type ArtistCardProps = {
  artist: User
  /**
   * Optional source page that establishes the `fromPage` for web-routes.
   */
  fromPage?: string
  style?: StyleProp<ViewStyle>
}

export const ArtistCard = ({ artist, fromPage, style }: ArtistCardProps) => {
  const { handle } = artist
  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle } },
      web: { route: handle, fromPage }
    })
  }, [navigation, handle, fromPage])

  return (
    <Card
      style={style}
      id={artist.user_id}
      imageSize={artist._profile_picture_sizes}
      primaryText={artist.name}
      secondaryText={formatProfileCardSecondaryText(artist.follower_count)}
      onPress={handlePress}
      type='user'
      user={artist}
    />
  )
}
