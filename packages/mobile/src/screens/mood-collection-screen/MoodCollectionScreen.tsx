import { useEffect } from 'react'

import {
  explorePageCollectionsSelectors,
  ExploreCollectionsVariant,
  explorePageCollectionsActions
} from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import type { ExploreMoodCollection } from 'app/screens/explore-screen/collections'
import { spacing } from 'app/styles/spacing'
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
      <ScreenHeader text={`${collection.title} Playlists`} />
      <ScreenContent>
        <WithLoader loading={status === Status.LOADING}>
          <CollectionList
            collection={exploreData}
            style={{ paddingTop: spacing(3), marginBottom: spacing(10) }}
          />
        </WithLoader>
      </ScreenContent>
    </Screen>
  )
}
