import { Status } from '@audius/common'
import {
  getCollections,
  getStatus
} from 'audius-client/src/common/store/pages/explore/exploreCollections/selectors'
import { ExploreCollectionsVariant } from 'audius-client/src/common/store/pages/explore/types'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'
import type { ExploreCollection as CollectionMetadata } from 'app/screens/explore-screen/collections'

type MoodCollectionScreenProps = {
  collection: CollectionMetadata
}

export const MoodCollectionScreen = ({
  collection
}: MoodCollectionScreenProps) => {
  const status = useSelectorWeb((state) =>
    getStatus(state, { variant: ExploreCollectionsVariant.MOOD })
  )
  const exploreData = useSelectorWeb(
    (state) =>
      getCollections(state, { variant: ExploreCollectionsVariant.MOOD }),
    isEqual
  )

  return (
    <Screen>
      <Header text={`${collection.title} Playlists`} />
      <WithLoader loading={status === Status.LOADING}>
        <CollectionList collection={exploreData} />
      </WithLoader>
    </Screen>
  )
}
