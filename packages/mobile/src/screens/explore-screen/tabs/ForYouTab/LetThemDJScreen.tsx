import {
  Status,
  explorePageCollectionsSelectors,
  ExploreCollectionsVariant
} from '@audius/common'
import { View } from 'react-native'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { LET_THEM_DJ } from '../../collections'
const { getCollections, getStatus } = explorePageCollectionsSelectors

export const LetThemDJScreen = () => {
  const status = useSelectorWeb(
    (state) =>
      getStatus(state, { variant: ExploreCollectionsVariant.LET_THEM_DJ }),
    isEqual
  )
  const exploreData = useSelectorWeb((state) =>
    getCollections(state, { variant: ExploreCollectionsVariant.LET_THEM_DJ })
  )

  return (
    <Screen>
      <Header text={LET_THEM_DJ.title} />
      <View style={{ flex: 1 }}>
        <WithLoader loading={status === Status.LOADING}>
          <CollectionList collection={exploreData} />
        </WithLoader>
      </View>
    </Screen>
  )
}
