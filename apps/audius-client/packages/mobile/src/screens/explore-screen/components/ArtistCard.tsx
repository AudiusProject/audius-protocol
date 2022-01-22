import React from 'react'

import { User } from 'audius-client/src/common/models/User'
import { EXPLORE_PAGE, profilePage } from 'audius-client/src/utils/route'
import { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { formatCount } from 'app/utils/format'

const formatProfileCardSecondaryText = (followers: number) => {
  const followersText = followers === 1 ? 'Follower' : 'Followers'
  return `${formatCount(followers)} ${followersText}`
}

type ArtistCardProps = {
  artist: User
  style: StyleProp<ViewStyle>
}

export const ArtistCard = ({ artist, style }: ArtistCardProps) => {
  const pushRouteWeb = usePushRouteWeb()
  const goToRoute = () => pushRouteWeb(profilePage(artist.handle), EXPLORE_PAGE)

  return (
    <Card
      style={style}
      id={artist.user_id}
      imageSize={artist._profile_picture_sizes}
      primaryText={artist.name}
      secondaryText={formatProfileCardSecondaryText(artist.follower_count)}
      onPress={goToRoute}
      type='user'
      user={artist}
    />
  )
}
