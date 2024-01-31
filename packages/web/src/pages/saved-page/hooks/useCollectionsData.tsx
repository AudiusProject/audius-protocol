import { useMemo } from 'react'

import {
  accountSelectors,
  cacheCollectionsSelectors,
  CommonState,
  savedPageSelectors
} from '@audius/common'
import { useGetLibraryAlbums, useGetLibraryPlaylists } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import { Status } from '@audius/common/models'
import { uniqBy } from 'lodash'
import { useSelector } from 'react-redux'

const { getUserId } = accountSelectors
const {
  getCollectionsCategory,
  getSelectedCategoryLocalAlbumAdds,
  getSelectedCategoryLocalAlbumRemovals,
  getSelectedCategoryLocalPlaylistAdds,
  getSelectedCategoryLocalPlaylistRemovals
} = savedPageSelectors
const { getCollections } = cacheCollectionsSelectors

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

  const locallyAddedCollections = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'album'
        ? getSelectedCategoryLocalAlbumAdds(state)
        : getSelectedCategoryLocalPlaylistAdds(state)
    const collectionsMap = getCollections(state, {
      ids
    })
    return ids.map((id) => collectionsMap[id])
  })

  const locallyRemovedCollections = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'album'
        ? getSelectedCategoryLocalAlbumRemovals(state)
        : getSelectedCategoryLocalPlaylistRemovals(state)
    return new Set(ids)
  })

  const {
    data: fetchedCollections,
    status: apiStatus,
    isLoadingMore,
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
    return uniqBy(
      [...locallyAddedCollections, ...(fetchedCollections || [])].filter(
        (a) => !locallyRemovedCollections.has(a.playlist_id)
      ),
      'playlist_id'
    )
  }, [locallyAddedCollections, fetchedCollections, locallyRemovedCollections])

  const status = isLoadingMore || hasMore ? Status.LOADING : apiStatus

  return {
    status,
    hasMore,
    fetchMore,
    collections
  }
}
