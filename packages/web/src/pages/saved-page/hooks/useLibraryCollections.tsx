import { useCallback, useMemo } from 'react'

import { useLibraryCollections as useLibraryCollectionsTQ } from '@audius/common/api'
import { savedPageSelectors, CommonState } from '@audius/common/store'
import { uniq } from 'lodash'
import { useSelector } from 'react-redux'

const {
  getCollectionsCategory,
  getSelectedCategoryLocalAlbumAdds,
  getSelectedCategoryLocalAlbumRemovals,
  getSelectedCategoryLocalPlaylistAdds,
  getSelectedCategoryLocalPlaylistRemovals
} = savedPageSelectors

type LibraryCollectionsParams = {
  collectionType: 'album' | 'playlist'
  filterValue?: string
}

export const useLibraryCollections = ({
  collectionType,
  filterValue
}: LibraryCollectionsParams) => {
  const selectedCategory = useSelector(getCollectionsCategory)

  const locallyAddedCollectionIds = useSelector((state: CommonState) => {
    return collectionType === 'album'
      ? getSelectedCategoryLocalAlbumAdds(state)
      : getSelectedCategoryLocalPlaylistAdds(state)
  })

  const locallyRemovedCollectionIds = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'album'
        ? getSelectedCategoryLocalAlbumRemovals(state)
        : getSelectedCategoryLocalPlaylistRemovals(state)
    return new Set(ids)
  })

  const {
    data: fetchedCollectionIds,
    status,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    fetchNextPage
  } = useLibraryCollectionsTQ({
    collectionType: collectionType === 'album' ? 'albums' : 'playlists',
    category: selectedCategory,
    query: filterValue,
    pageSize: 20,
    sortMethod: 'added_date',
    sortDirection: 'desc'
  })

  const fetchMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const collectionIds = useMemo(() => {
    return uniq(
      [...locallyAddedCollectionIds, ...(fetchedCollectionIds || [])].filter(
        (playlistId) => !locallyRemovedCollectionIds.has(playlistId)
      )
    )
  }, [
    locallyAddedCollectionIds,
    fetchedCollectionIds,
    locallyRemovedCollectionIds
  ])

  return {
    status,
    hasMore: hasNextPage,
    fetchMore,
    collectionIds,
    isPending,
    isFetchingNextPage
  }
}
