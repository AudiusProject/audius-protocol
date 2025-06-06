import { useCallback } from 'react'

import { useCurrentAccount } from '@audius/common/api'
import { FavoriteSource } from '@audius/common/models'
import {
  smartCollectionPageSelectors,
  smartCollectionPageActions,
  collectionPageActions,
  playlistLibraryHelpers,
  collectionsSocialActions
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import type { FastImageProps } from '@audius/harmony-native'
import { Screen, VirtualizedScrollView } from 'app/components/core'
import { CollectionScreenDetailsTile } from 'app/screens/collection-screen/CollectionScreenDetailsTile'
import type { SmartCollection } from 'app/screens/explore-screen/smartCollections'
import { makeStyles } from 'app/styles'
const { findInPlaylistLibrary } = playlistLibraryHelpers

const { saveSmartCollection, unsaveSmartCollection } = collectionsSocialActions
const { getCollection } = smartCollectionPageSelectors
const { fetchSmartCollection } = smartCollectionPageActions
const { resetCollection } = collectionPageActions

const useStyles = makeStyles(({ spacing }) => ({
  root: {
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
  const {
    variant,
    icon: Icon,
    title,
    description,
    gradientColors,
    gradientAngle
  } = smartCollection
  const styles = useStyles()
  const dispatch = useDispatch()

  const handleFetchSmartCollection = useCallback(() => {
    dispatch(resetCollection())
    dispatch(fetchSmartCollection({ variant }))
  }, [dispatch, variant])

  useFocusEffect(handleFetchSmartCollection)

  const collection = useSelector((state) => getCollection(state, { variant }))
  const playlistName = collection?.playlist_name ?? title
  const playlistDescription = collection?.description ?? description

  const { data: playlistLibrary } = useCurrentAccount({
    select: (account) => account?.playlistLibrary
  })
  const isSaved = playlistLibrary
    ? !!findInPlaylistLibrary(playlistLibrary, smartCollection.variant)
    : false

  const handlePressSave = useCallback(() => {
    if (collection?.has_current_user_saved) {
      dispatch(unsaveSmartCollection(variant, FavoriteSource.COLLECTION_PAGE))
    } else {
      dispatch(saveSmartCollection(variant, FavoriteSource.COLLECTION_PAGE))
    }
  }, [collection, variant, dispatch])

  const renderImage = useCallback(
    ({ style }: FastImageProps) => {
      return (
        <LinearGradient
          colors={gradientColors}
          angle={gradientAngle}
          style={[style, styles.image]}
        >
          {Icon ? (
            <View style={styles.imageIcon}>
              <Icon width='100%' height='100%' color='white' />
            </View>
          ) : null}
        </LinearGradient>
      )
    },
    [gradientColors, gradientAngle, styles, Icon]
  )

  return (
    <Screen>
      <VirtualizedScrollView style={styles.root}>
        <CollectionScreenDetailsTile
          collectionId={variant}
          description={playlistDescription}
          hasSaved={isSaved}
          hideFavoriteCount
          hideOverflow
          hideRepostCount
          hideActions
          onPressSave={handlePressSave}
          renderImage={renderImage}
          title={playlistName}
        />
      </VirtualizedScrollView>
    </Screen>
  )
}
