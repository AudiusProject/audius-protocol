import { useCallback, useEffect } from 'react'

import {
  FavoriteSource,
  accountSelectors,
  smartCollectionPageSelectors,
  collectionsSocialActions,
  smartCollectionPageActions,
  playlistLibraryHelpers
} from '@audius/common'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import { VirtualizedScrollView } from 'app/components/core'
import { CollectionScreenDetailsTile } from 'app/screens/collection-screen/CollectionScreenDetailsTile'
import type { SmartCollection } from 'app/screens/explore-screen/smartCollections'
import { makeStyles } from 'app/styles'
const { findInPlaylistLibrary } = playlistLibraryHelpers

const { saveSmartCollection, unsaveSmartCollection } = collectionsSocialActions
const { getCollection } = smartCollectionPageSelectors
const getPlaylistLibrary = accountSelectors.getPlaylistLibrary
const { fetchSmartCollection } = smartCollectionPageActions

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flex: 1,
    padding: spacing(3)
  },
  image: {
    borderRadius: 4
  },
  imageIcon: {
    opacity: 0.3,
    maxWidth: '100%',
    height: '100%'
  }
}))

type SmartCollectionScreenProps = {
  smartCollection: SmartCollection
}

/**
 * `SmartCollectionScreen` displays the details of a smart collection
 */
export const SmartCollectionScreen = (props: SmartCollectionScreenProps) => {
  const { smartCollection } = props
  const { variant } = smartCollection
  const styles = useStyles()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchSmartCollection({ variant }))
  }, [dispatch, variant])

  const collection = useSelector((state) =>
    getCollection(state, { variant: smartCollection.variant })
  )

  const playlistName = collection?.playlist_name ?? smartCollection.title
  const description = collection?.description ?? smartCollection.description

  const playlistLibrary = useSelector(getPlaylistLibrary)

  const isSaved = playlistLibrary
    ? !!findInPlaylistLibrary(playlistLibrary, smartCollection.variant)
    : false

  const handlePressSave = useCallback(() => {
    if (collection?.has_current_user_saved) {
      dispatch(
        unsaveSmartCollection(
          smartCollection.variant,
          FavoriteSource.COLLECTION_PAGE
        )
      )
    } else {
      dispatch(
        saveSmartCollection(
          smartCollection.variant,
          FavoriteSource.COLLECTION_PAGE
        )
      )
    }
  }, [collection, smartCollection, dispatch])

  const renderImage = () => {
    const Icon = smartCollection.icon
    return (
      <LinearGradient
        colors={smartCollection.gradientColors}
        angle={smartCollection.gradientAngle}
        style={styles.image}
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
