import { useCallback } from 'react'

import type { ID } from '@audius/common'
import {
  CreatePlaylistSource,
  mobileOverflowMenuUIActions,
  OverflowAction,
  OverflowSource
} from '@audius/common'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconSave from 'app/assets/images/iconMultiselectAdd.svg'
import { Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { open: openOverflowMenu } = mobileOverflowMenuUIActions

const messages = {
  create: (collectionType: 'album' | 'playlist') =>
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
    width: '50%'
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

    const overflowActions =
      collectionType === 'album'
        ? [OverflowAction.CREATE_ALBUM, OverflowAction.ADD_TO_ALBUM]
        : [OverflowAction.CREATE_PLAYLIST, OverflowAction.ADD_TO_PLAYLIST]

    dispatch(
      openOverflowMenu({
        source: OverflowSource.PROFILE,
        id: collectionType,
        overflowActions
      })
    )
  }, [onCreate, dispatch, collectionType])

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
          {messages.create(collectionType)}
        </Text>
      </View>
    </Tile>
  )
}
