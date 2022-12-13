import { useCallback } from 'react'

import type { UserCollection } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { useNavigation } from 'app/hooks/useNavigation'
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
  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    navigation.push('Collection', { id: collection.playlist_id })
  }, [navigation, collection])

  const renderImage = useCallback(
    () => <CollectionImage collection={collection} />,
    [collection]
  )

  return (
    <Card
      style={style}
      renderImage={renderImage}
      type='collection'
      id={collection.playlist_id.toString()}
      primaryText={collection.playlist_name}
      secondaryText={formatPlaylistCardSecondaryText(
        collection.save_count,
        collection.playlist_contents.track_ids.length
      )}
      onPress={handlePress}
      user={collection.user}
    />
  )
}
