import { useEffect } from 'react'

import {
  Status,
  explorePageCollectionsSelectors,
  ExploreCollectionsVariant,
  explorePageCollectionsActions,
  useProxySelector
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import type { ExploreMoodCollection } from 'app/screens/explore-screen/collections'
const { getCollections, getStatus } = explorePageCollectionsSelectors
const { fetch } = explorePageCollectionsActions

type MoodCollectionScreenProps = {
  collection: ExploreMoodCollection
}

export const MoodCollectionScreen = ({
  collection
}: MoodCollectionScreenProps) => {
  const { moods } = collection
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetch({ variant: ExploreCollectionsVariant.MOOD, moods }))
  }, [dispatch, moods])

  const status = useSelector((state) =>
    getStatus(state, { variant: ExploreCollectionsVariant.MOOD })
  )

  const exploreData = useProxySelector(
    (state) =>
      getCollections(state, { variant: ExploreCollectionsVariant.MOOD }),
    []
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
