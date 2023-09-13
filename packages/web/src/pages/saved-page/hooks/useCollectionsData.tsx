import { useMemo } from 'react'

import {
  accountSelectors,
  cacheCollectionsSelectors,
  CommonState,
  savedPageSelectors,
  useAllPaginatedQuery,
  useGetLibraryAlbums,
  useGetLibraryPlaylists
} from '@audius/common'
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

export const useCollectionsData = (collectionType: 'album' | 'playlist') => {
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
    status,
    hasMore,
    loadMore: fetchMore
  } = useAllPaginatedQuery(
    collectionType === 'album' ? useGetLibraryAlbums : useGetLibraryPlaylists,
    {
      userId: currentUserId!,
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

  return {
    status,
    hasMore,
    fetchMore,
    collections
  }
}
