import Status from 'audius-client/src/common/models/Status'
import {
  getCollections,
  getStatus
} from 'audius-client/src/common/store/pages/explore/exploreCollections/selectors'
import { ExploreCollectionsVariant } from 'audius-client/src/common/store/pages/explore/types'
import { View } from 'react-native'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { LET_THEM_DJ } from '../../collections'

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
