import {
  Status,
  ExploreCollectionsVariant,
  explorePageCollectionsSelectors
} from '@audius/common'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TOP_ALBUMS } from '../../collections'
const { getCollections, getStatus } = explorePageCollectionsSelectors

export const TopAlbumsScreen = () => {
  const status = useSelectorWeb(
    (state) =>
      getStatus(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS }),
    isEqual
  )
  const exploreData = useSelectorWeb((state) =>
    getCollections(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS })
  )

  return (
    <Screen>
      <Header text={TOP_ALBUMS.title} />
      <WithLoader loading={status === Status.LOADING}>
        <CollectionList collection={exploreData} />
      </WithLoader>
    </Screen>
  )
}
