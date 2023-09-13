import { useCallback } from 'react'

import type { ID } from '@audius/common'
import { cacheCollectionsActions, CreatePlaylistSource } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconSave from 'app/assets/images/iconMultiselectAdd.svg'
import { Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { createPlaylist } = cacheCollectionsActions

const messages = {
  createPlaylist: 'Create Playlist'
}

type AddCollectionCardProps = {
  onCreate?: () => void
  source: CreatePlaylistSource
  sourceTrackId?: ID | null
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
  sourceTrackId = null
}: AddCollectionCardProps) => {
  const styles = useStyles()
  const { neutralLight2 } = useThemeColors()
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    if (onCreate) return onCreate()

    dispatch(
      createPlaylist(
        { playlist_name: 'New Playlist' },
        source,
        sourceTrackId,
        source === CreatePlaylistSource.FROM_TRACK ? 'toast' : 'route'
      )
    )
  }, [onCreate, dispatch, source, sourceTrackId])

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
          {messages.createPlaylist}
        </Text>
      </View>
    </Tile>
  )
}
