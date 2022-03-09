import { FavoriteSource } from 'audius-client/src/common/models/Analytics'
import { SmartCollection } from 'audius-client/src/common/models/Collection'
import {
  saveSmartCollection,
  unsaveSmartCollection
} from 'audius-client/src/common/store/social/collections/actions'
import { getCollection } from 'common/store/pages/smart-collection/selectors'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { VirtualizedScrollView } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { CollectionScreenDetailsTile } from 'app/screens/collection-screen/CollectionScreenDetailsTile'
import { SmartCollection as SmartCollectionMetadata } from 'app/screens/explore-screen/smartCollections'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3)
  },
  headerContainer: {
    marginBottom: 240
  },
  imageIcon: {
    opacity: 0.3,
    maxWidth: '100%',
    height: '100%'
  }
}))

type SmartCollectionScreenProps = {
  smartCollection: SmartCollectionMetadata
}

/**
 * `SmartCollectionScreen` displays the details of a smart collection
 */
export const SmartCollectionScreen = ({
  smartCollection
}: SmartCollectionScreenProps) => {
  const collection = useSelectorWeb(state =>
    getCollection(state, { variant: smartCollection.variant })
  )

  if (!collection) {
    console.warn(
      'Collection missing for SmartCollectionScreen, preventing render'
    )
    return null
  }

  return (
    <SmartCollectionScreenComponent
      collection={collection as SmartCollection}
      metadata={smartCollection}
    />
  )
}

type SmartCollectionScreenComponentProps = {
  collection: SmartCollection
  metadata: SmartCollectionMetadata
}

const SmartCollectionScreenComponent = ({
  collection,
  metadata
}: SmartCollectionScreenComponentProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const { description, has_current_user_saved, playlist_name } = collection

  const handlePressSave = () => {
    if (has_current_user_saved) {
      dispatchWeb(
        unsaveSmartCollection(metadata.variant, FavoriteSource.COLLECTION_PAGE)
      )
    } else {
      dispatchWeb(
        saveSmartCollection(metadata.variant, FavoriteSource.COLLECTION_PAGE)
      )
    }
  }

  const renderImage = () => {
    const Icon = metadata.icon
    return (
      <LinearGradient
        colors={metadata.gradientColors}
        angle={metadata.gradientAngle}
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
      listKey={`${playlist_name}_Playlist_Screen`}
      style={styles.root}
    >
      <View style={styles.headerContainer}>
        <CollectionScreenDetailsTile
          description={description ?? ''}
          hasSaved={has_current_user_saved}
          hideFavoriteCount
          hideOverflow
          hideRepost
          hideRepostCount
          hideShare
          onPressSave={handlePressSave}
          renderImage={renderImage}
          title={playlist_name}
        />
      </View>
    </VirtualizedScrollView>
  )
}
