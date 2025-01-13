import { useMemo } from 'react'

import { useLibraryCollections } from '@audius/common/api'
import { CollectionType, savedPageSelectors } from '@audius/common/store'
import { uniqBy } from 'lodash'
import { useSelector } from 'react-redux'

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

  const { data, status, hasMore, loadMore, isLoadingMore, isPending } =
    useLibraryCollections({
      collectionType,
      category: selectedCategory,
      query: filterValue
    })

  const collections = useMemo(() => {
    return uniqBy([...(data || [])], 'playlist_id')
  }, [data])

  return {
    collections,
    status,
    hasMore,
    isPending,
    loadMore,
    isLoadingMore
  }
}
