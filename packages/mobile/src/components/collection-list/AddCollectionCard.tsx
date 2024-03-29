import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
import { CreatePlaylistSource } from '@audius/common/models'
import { cacheCollectionsActions } from '@audius/common/store'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconSave } from '@audius/harmony-native'
import { Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { createPlaylist, createAlbum } = cacheCollectionsActions

const messages = {
  createPlaylist: (collectionType: 'album' | 'playlist') =>
    `Create ${capitalize(collectionType)}`
}

type AddCollectionCardProps = {
  onCreate?: () => void
  source: CreatePlaylistSource
  sourceTrackId?: ID | null
  collectionType: 'album' | 'playlist'
}

const useStyles = makeStyles(({ spacing }) => ({
  cardContent: {
    alignContent: 'center',
    height: 210,
    justifyContent: 'center'
  },
  cardText: {
    alignSelf: 'center',
    lineHeight: 20,
    textAlign: 'center',
    width: '60%'
  },
  textContainer: {
    gap: spacing(1)
  }
}))

export const AddCollectionCard = ({
  onCreate,
  source = CreatePlaylistSource.LIBRARY_PAGE,
  sourceTrackId = null,
  collectionType
}: AddCollectionCardProps) => {
  const styles = useStyles()
  const { neutralLight2 } = useThemeColors()
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    if (onCreate) return onCreate()

    dispatch(
      (collectionType === 'album' ? createAlbum : createPlaylist)(
        { playlist_name: 'New Playlist' },
        source,
        sourceTrackId,
        source === CreatePlaylistSource.FROM_TRACK ? 'toast' : 'route'
      )
    )
  }, [onCreate, dispatch, collectionType, source, sourceTrackId])

  return (
    <Tile onPress={handlePress} styles={{ content: styles.cardContent }}>
      <View style={styles.textContainer}>
        <IconSave
          fill={neutralLight2}
          height={16}
          width={16}
          style={{ alignSelf: 'center' }}
        />
        <Text
          numberOfLines={2}
          style={styles.cardText}
          color={'neutralLight2'}
          fontSize='medium'
          weight='bold'
        >
          {messages.createPlaylist(collectionType)}
        </Text>
      </View>
    </Tile>
  )
}
