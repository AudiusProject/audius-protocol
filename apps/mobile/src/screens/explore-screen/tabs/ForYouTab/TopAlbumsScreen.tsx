import { useEffect } from 'react'

import {
  Status,
  ExploreCollectionsVariant,
  explorePageCollectionsSelectors,
  explorePageCollectionsActions
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/with-loader/WithLoader'

import { TOP_ALBUMS } from '../../collections'
const { getCollections, getStatus } = explorePageCollectionsSelectors
const { fetch } = explorePageCollectionsActions

export const TopAlbumsScreen = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetch({ variant: ExploreCollectionsVariant.TOP_ALBUMS }))
  }, [dispatch])

  const status = useSelector((state) =>
    getStatus(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS })
  )

  const exploreData = useSelector((state) =>
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
