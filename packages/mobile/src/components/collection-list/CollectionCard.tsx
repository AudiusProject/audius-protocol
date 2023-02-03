import { useCallback } from 'react'

import type { Collection } from '@audius/common'
import { SquareSizes } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { formatCount } from 'app/utils/format'

import type { ImageProps } from '../image/FastImage'

const formatPlaylistCardSecondaryText = (saves: number, tracks: number) => {
  const savesText = saves === 1 ? 'Favorite' : 'Favorites'
  const tracksText = tracks === 1 ? 'Track' : 'Tracks'
  return `${formatCount(saves)} ${savesText} • ${tracks} ${tracksText}`
}

type CollectionCardProps = {
  collection: Collection
  style?: StyleProp<ViewStyle>
  /** Override for what number to show as the # of tracks. Optional. */
  numTracks?: number
}

export const CollectionCard = ({
  collection,
  numTracks,
  style
}: CollectionCardProps) => {
  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    navigation.push('Collection', { id: collection.playlist_id })
  }, [navigation, collection])

  const renderImage = useCallback(
    (props: ImageProps) => (
      <CollectionImage
        collection={collection}
        size={SquareSizes.SIZE_480_BY_480}
        {...props}
      />
    ),
    [collection]
  )

  return (
    <Card
      style={style}
      renderImage={renderImage}
      type='collection'
      id={collection.playlist_id}
      primaryText={collection.playlist_name}
      secondaryText={formatPlaylistCardSecondaryText(
        collection.save_count,
        numTracks ?? collection.playlist_contents.track_ids.length
      )}
      onPress={handlePress}
    />
  )
}
