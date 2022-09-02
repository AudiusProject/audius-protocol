import { useEffect } from 'react'

import {
  Status,
  explorePageCollectionsSelectors,
  ExploreCollectionsVariant,
  explorePageCollectionsActions
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'

import { LET_THEM_DJ } from '../../collections'
const { getCollections, getStatus } = explorePageCollectionsSelectors
const { fetch } = explorePageCollectionsActions

export const LetThemDJScreen = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetch({ variant: ExploreCollectionsVariant.LET_THEM_DJ }))
  }, [dispatch])

  const status = useSelector((state) =>
    getStatus(state, { variant: ExploreCollectionsVariant.LET_THEM_DJ })
  )

  const exploreData = useSelector((state) =>
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
