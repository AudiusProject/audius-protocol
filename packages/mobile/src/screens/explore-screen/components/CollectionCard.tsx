import { UserCollection } from 'audius-client/src/common/models/Collection'
import {
  albumPage,
  EXPLORE_PAGE,
  playlistPage
} from 'audius-client/src/utils/route'
import { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { formatCount } from 'app/utils/format'

const formatPlaylistCardSecondaryText = (saves: number, tracks: number) => {
  const savesText = saves === 1 ? 'Favorite' : 'Favorites'
  const tracksText = tracks === 1 ? 'Track' : 'Tracks'
  return `${formatCount(saves)} ${savesText} • ${tracks} ${tracksText}`
}

type CollectionCardProps = {
  collection: UserCollection
  style?: StyleProp<ViewStyle>
}

export const CollectionCard = ({ collection, style }: CollectionCardProps) => {
  const pushRouteWeb = usePushRouteWeb()
  const collectionPage = collection.is_album ? albumPage : playlistPage
  const route = collectionPage(
    collection.user.handle,
    collection.playlist_name,
    collection.playlist_id
  )

  const goToRoute = () => pushRouteWeb(route, EXPLORE_PAGE)

  return (
    <Card
      style={style}
      id={collection.playlist_id}
      type='collection'
      imageSize={collection._cover_art_sizes}
      primaryText={collection.playlist_name}
      secondaryText={formatPlaylistCardSecondaryText(
        collection.save_count,
        collection.playlist_contents.track_ids.length
      )}
      onPress={goToRoute}
      user={collection.user}
    />
  )
}
