import { useCallback, useState } from 'react'

import type { ID } from '@audius/common/models'
import { CreatePlaylistSource } from '@audius/common/models'
import { cacheCollectionsActions } from '@audius/common/store'
import type { Maybe } from '@audius/common/utils'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { IconSave, Paper, Text } from '@audius/harmony-native'

const { createPlaylist, createAlbum } = cacheCollectionsActions

const messages = {
  createPlaylist: (collectionType: 'album' | 'playlist') =>
    `Create \n ${capitalize(collectionType)}`
}

type AddCollectionCardProps = {
  onCreate?: () => void
  source: CreatePlaylistSource
  sourceTrackId?: ID | null
  collectionType: 'album' | 'playlist'
}

export const AddCollectionCard = ({
  onCreate,
  source = CreatePlaylistSource.LIBRARY_PAGE,
  sourceTrackId = null,
  collectionType
}: AddCollectionCardProps) => {
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    if (onCreate) return onCreate()
    dispatch(
      (collectionType === 'album' ? createAlbum : createPlaylist)(
        {
          playlist_name:
            collectionType === 'album' ? 'New Album' : 'New Playlist'
        },
        source,
        sourceTrackId,
        source === CreatePlaylistSource.FROM_TRACK ? 'toast' : 'route'
      )
    )
  }, [onCreate, dispatch, collectionType, source, sourceTrackId])

  const [height, setHeight] = useState<Maybe<number>>(undefined)

  return (
    <Paper
      alignItems='center'
      justifyContent='center'
      gap='xs'
      onPress={handlePress}
      h={height}
      onLayout={(e) => {
        // Dynamically size this card based on the width of it's container
        // to match collection card image.
        // 98 is the height of the rest of the collection card, which is static
        setHeight(e.nativeEvent.layout.width + 98)
      }}
      style={{ minHeight: 250 }}
    >
      <IconSave color='default' size='m' />
      <Text numberOfLines={2} variant='title' textAlign='center'>
        {messages.createPlaylist(collectionType)}
      </Text>
    </Paper>
  )
}
