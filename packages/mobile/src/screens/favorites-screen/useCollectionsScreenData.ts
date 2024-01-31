import type { CollectionType, CommonState } from '@audius/common'
import {
  SavedPageTabs,
  accountSelectors,
  cacheCollectionsSelectors,
  reachabilitySelectors,
  savedPageSelectors
} from '@audius/common'
import { useGetLibraryAlbums, useGetLibraryPlaylists } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import {
  filterCollections,
  shallowCompare,
  removeNullable
} from '@audius/common/utils'
import uniq from 'lodash/uniq'
import { useSelector } from 'react-redux'

import { useOfflineTracksStatus } from 'app/hooks/useOfflineTrackStatus'
import type { AppState } from 'app/store'
import {
  getIsDoneLoadingFromDisk,
  getOfflineCollectionsStatus
} from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

const { getIsReachable } = reachabilitySelectors
const { getUserId } = accountSelectors
const { getCollection, getCollectionWithUser } = cacheCollectionsSelectors
const {
  getCategory,
  getSelectedCategoryLocalAlbumAdds,
  getSelectedCategoryLocalAlbumRemovals,
  getSelectedCategoryLocalPlaylistAdds,
  getSelectedCategoryLocalPlaylistRemovals
} = savedPageSelectors

type UseCollectionsScreenDataConfig = {
  filterValue?: string
  collectionType: CollectionType
}

export const useCollectionsScreenData = ({
  collectionType,
  filterValue
}: UseCollectionsScreenDataConfig) => {
  const isDoneLoadingFromDisk = useSelector(getIsDoneLoadingFromDisk)
  const isReachable = useSelector(getIsReachable)
  const selectedCategory = useSelector((state) =>
    getCategory(state, {
      currentTab:
        collectionType === 'albums'
          ? SavedPageTabs.ALBUMS
          : SavedPageTabs.PLAYLISTS
    })
  )
  const currentUserId = useSelector(getUserId)
  const offlineTracksStatus = useOfflineTracksStatus({ skipIfOnline: true })

  const locallyAddedCollections = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'albums'
        ? getSelectedCategoryLocalAlbumAdds(state)
        : getSelectedCategoryLocalPlaylistAdds(state)
    return ids
  })

  const locallyRemovedCollections = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'albums'
        ? getSelectedCategoryLocalAlbumRemovals(state)
        : getSelectedCategoryLocalPlaylistRemovals(state)
    return new Set(ids)
  })

  const {
    data: collectionsData,
    status: fetchedStatus,
    hasMore,
    isLoadingMore,
    loadMore: fetchMore
  } = useAllPaginatedQuery(
    collectionType === 'albums' ? useGetLibraryAlbums : useGetLibraryPlaylists,
    {
      category: selectedCategory,
      query: filterValue,
      userId: currentUserId!
    },
    {
      pageSize: 20,
      disabled: currentUserId == null || !isReachable
    }
  )
  const fetchedCollectionIds = collectionsData?.map((c) => c.playlist_id)

  // TODO: Filter collections using `filterCollections` from Common if all loaded, or by changing fetch args if not all loaded

  const availableCollectionIds = useProxySelector(
    (state: AppState) => {
      if (isReachable) {
        const filteredLocallyAddedCollectionIds = filterCollections(
          locallyAddedCollections
            .map((c) => getCollectionWithUser(state, { id: c }))
            .filter(removeNullable),
          { filterText: filterValue }
        ).map((p) => p.playlist_id)
        return uniq(
          [
            ...filteredLocallyAddedCollectionIds,
            ...fetchedCollectionIds
          ].filter((id) => !locallyRemovedCollections.has(id))
        )
      }

      if (!isDoneLoadingFromDisk) {
        return []
      }

      const offlineCollectionsStatus = getOfflineCollectionsStatus(state)
      const offlineCollectionIds = Object.keys(offlineCollectionsStatus).filter(
        (k) => offlineCollectionsStatus[k] === OfflineDownloadStatus.SUCCESS
      )
      return offlineCollectionIds
        .map((stringId) => Number(stringId))
        .filter((collectionId) => {
          const collection = getCollection(state, { id: collectionId })
          if (collection == null) {
            console.error(
              `Unexpected missing fetched collection: ${collectionId}`
            )
            return false
          }
          const trackIds =
            collection.playlist_contents.track_ids.map(
              (trackData) => trackData.track
            ) ?? []
          // Don't show a playlist in Offline Mode if it has at least one track but none of the tracks have been downloaded yet OR if it is not marked for download
          return (
            trackIds.length === 0 ||
            trackIds.some((t) => {
              return (
                offlineTracksStatus &&
                offlineTracksStatus[t.toString()] ===
                  OfflineDownloadStatus.SUCCESS
              )
            })
          )
        })
    },
    [
      fetchedCollectionIds,
      isReachable,
      isDoneLoadingFromDisk,
      offlineTracksStatus
    ],
    shallowCompare
  )

  let status: Status
  if (isReachable) {
    status = hasMore || isLoadingMore ? Status.LOADING : fetchedStatus
  } else {
    status = isDoneLoadingFromDisk ? Status.SUCCESS : Status.LOADING
  }

  return {
    collectionIds: availableCollectionIds,
    hasMore,
    fetchMore,
    status
  }
}
