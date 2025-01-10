import { useMemo } from 'react'

import { useLibraryCollections } from '@audius/common/api'
import { savedPageSelectors, CollectionType } from '@audius/common/store'
import { uniqBy } from 'lodash'
import { useSelector } from 'react-redux'

import { useLocalCollections } from './useLocalCollections'

const { getCollectionsCategory } = savedPageSelectors

type CollectionsDataParams = {
  collectionType: CollectionType
  filterValue?: string
}

export const useCollectionsData = ({
  collectionType,
  filterValue
}: CollectionsDataParams) => {
  const selectedCategory = useSelector(getCollectionsCategory)
  const { locallyAddedCollections, locallyRemovedIds } =
    useLocalCollections(collectionType)

  const { data, status, hasMore, loadMore, isLoadingMore, isPending } =
    useLibraryCollections({
      collectionType,
      category: selectedCategory,
      query: filterValue
    })

  const collections = useMemo(() => {
    return uniqBy(
      [...locallyAddedCollections, ...(data ?? [])].filter(
        (a) => !locallyRemovedIds.has(a.playlist_id)
      ),
      'playlist_id'
    )
  }, [locallyAddedCollections, data, locallyRemovedIds])

  return {
    status,
    hasMore,
    isPending,
    loadMore,
    isLoadingMore,
    collections
  }
}
