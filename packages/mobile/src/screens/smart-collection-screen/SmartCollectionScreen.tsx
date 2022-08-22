import { useCallback } from 'react'

import {
  FavoriteSource,
  accountSelectors,
  smartCollectionPageSelectors,
  findInPlaylistLibrary,
  collectionsSocialActions
} from '@audius/common'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { VirtualizedScrollView } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { CollectionScreenDetailsTile } from 'app/screens/collection-screen/CollectionScreenDetailsTile'
import type { SmartCollection as SmartCollectionsmartCollection } from 'app/screens/explore-screen/smartCollections'
import { makeStyles } from 'app/styles'
const { saveSmartCollection, unsaveSmartCollection } = collectionsSocialActions
const { getCollection } = smartCollectionPageSelectors
const getPlaylistLibrary = accountSelectors.getPlaylistLibrary

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flex: 1,
    padding: spacing(3)
  },
  imageIcon: {
    opacity: 0.3,
    maxWidth: '100%',
    height: '100%'
  }
}))

type SmartCollectionScreenProps = {
  smartCollection: SmartCollectionsmartCollection
}

/**
 * `SmartCollectionScreen` displays the details of a smart collection
 */
export const SmartCollectionScreen = ({
  smartCollection
}: SmartCollectionScreenProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const collection = useSelectorWeb((state) =>
    getCollection(state, { variant: smartCollection.variant })
  )

  const playlistName = collection?.playlist_name ?? smartCollection.title
  const description = collection?.description ?? smartCollection.description

  const playlistLibrary = useSelectorWeb(getPlaylistLibrary)

  const isSaved = playlistLibrary
    ? !!findInPlaylistLibrary(playlistLibrary, smartCollection.variant)
    : false

  const handlePressSave = useCallback(() => {
    if (collection?.has_current_user_saved) {
      dispatchWeb(
        unsaveSmartCollection(
          smartCollection.variant,
          FavoriteSource.COLLECTION_PAGE
        )
      )
    } else {
      dispatchWeb(
        saveSmartCollection(
          smartCollection.variant,
          FavoriteSource.COLLECTION_PAGE
        )
      )
    }
  }, [collection, smartCollection, dispatchWeb])

  const renderImage = () => {
    const Icon = smartCollection.icon
    return (
      <LinearGradient
        colors={smartCollection.gradientColors}
        angle={smartCollection.gradientAngle}
      >
        {Icon ? (
          <View style={styles.imageIcon}>
            <Icon width='100%' height='100%' />
          </View>
        ) : null}
      </LinearGradient>
    )
  }

  return (
    <VirtualizedScrollView
      listKey={`${playlistName}_Playlist_Screen`}
      style={styles.root}
    >
      <CollectionScreenDetailsTile
        description={description}
        hasSaved={isSaved}
        hideFavoriteCount
        hideOverflow
        hideRepost
        hideRepostCount
        hideShare
        onPressSave={handlePressSave}
        renderImage={renderImage}
        title={playlistName}
      />
    </VirtualizedScrollView>
  )
}
