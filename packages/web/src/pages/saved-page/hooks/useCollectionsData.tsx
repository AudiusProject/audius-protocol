import { useMemo } from 'react'

import { useGetLibraryAlbums, useGetLibraryPlaylists } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import { accountSelectors, savedPageSelectors } from '@audius/common/store'
import { uniqBy } from 'lodash'
import { useSelector } from 'react-redux'

const { getUserId } = accountSelectors
const { getCollectionsCategory } = savedPageSelectors

type CollectionsDataParams = {
  collectionType: 'album' | 'playlist'
  filterValue?: string
}

export const useCollectionsData = ({
  collectionType,
  filterValue
}: CollectionsDataParams) => {
  const currentUserId = useSelector(getUserId)
  const selectedCategory = useSelector(getCollectionsCategory)

  const {
    data: fetchedCollections,
    status,
    hasMore,
    loadMore: fetchMore
  } = useAllPaginatedQuery(
    collectionType === 'album' ? useGetLibraryAlbums : useGetLibraryPlaylists,
    {
      userId: currentUserId!,
      query: filterValue,
      category: selectedCategory
    },
    {
      pageSize: 20,
      disabled: currentUserId == null
    }
  )
  const collections = useMemo(() => {
    return uniqBy([...(fetchedCollections || [])], 'playlist_id')
  }, [fetchedCollections])

  return {
    status,
    hasMore,
    fetchMore,
    collections
  }
}
