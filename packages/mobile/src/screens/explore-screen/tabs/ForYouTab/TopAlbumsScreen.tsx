import { useEffect } from 'react'

import { Status } from '@audius/common/models'
import {
  explorePageCollectionsSelectors,
  explorePageCollectionsActions,
  ExploreCollectionsVariant
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { spacing } from 'app/styles/spacing'

import { TOP_ALBUMS } from '../../collections'
const { getCollectionIds, getStatus } = explorePageCollectionsSelectors
const { fetch } = explorePageCollectionsActions

export const TopAlbumsScreen = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetch({ variant: ExploreCollectionsVariant.TOP_ALBUMS }))
  }, [dispatch])

  const status = useSelector((state) =>
    getStatus(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS })
  )

  const collectionIds = useSelector((state) =>
    getCollectionIds(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS })
  )

  return (
    <Screen>
      <ScreenHeader text={TOP_ALBUMS.title} />
      <ScreenContent>
        <WithLoader loading={status === Status.LOADING}>
          <CollectionList
            style={{ paddingTop: spacing(3) }}
            collectionIds={collectionIds}
          />
        </WithLoader>
      </ScreenContent>
    </Screen>
  )
}
