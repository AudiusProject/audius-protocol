import { useCallback } from 'react'

import { useLibraryCollections as useLibraryCollectionsTQ } from '@audius/common/api'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  savedPageSelectors,
  SavedPageTabs,
  reachabilitySelectors
} from '@audius/common/store'
import type { CommonState, CollectionType } from '@audius/common/store'
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
const { getCollection, getCollectionWithUser } = cacheCollectionsSelectors
const {
  getCategory,
  getSelectedCategoryLocalAlbumAdds,
  getSelectedCategoryLocalAlbumRemovals,
  getSelectedCategoryLocalPlaylistAdds,
  getSelectedCategoryLocalPlaylistRemovals
} = savedPageSelectors

type UseLibraryCollectionsConfig = {
  filterValue?: string
  collectionType: CollectionType
}

export const useLibraryCollections = ({
  collectionType,
  filterValue
}: UseLibraryCollectionsConfig) => {
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
  const offlineTracksStatus = useOfflineTracksStatus({ skipIfOnline: true })

  const locallyAddedCollectionIds = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'albums'
        ? getSelectedCategoryLocalAlbumAdds(state)
        : getSelectedCategoryLocalPlaylistAdds(state)
    return ids
  })

  const locallyRemovedCollectionIds = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'albums'
        ? getSelectedCategoryLocalAlbumRemovals(state)
        : getSelectedCategoryLocalPlaylistRemovals(state)
    return new Set(ids)
  })

  const {
    data: fetchedCollectionIds,
    isFetching,
    isSuccess,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isPending
  } = useLibraryCollectionsTQ({
    collectionType,
    category: selectedCategory,
    query: filterValue,
    pageSize: 20,
    sortMethod: 'added_date',
    sortDirection: 'desc'
  })

  // TODO: Filter collections using `filterCollections` from Common if all loaded, or by changing fetch args if not all loaded

  const collectionIds = useProxySelector(
    (state: AppState) => {
      if (isReachable) {
        const filteredLocallyAddedCollectionIds = filterCollections(
          locallyAddedCollectionIds
            .map((c) => getCollectionWithUser(state, { id: c }))
            .filter(removeNullable),
          { filterText: filterValue }
        ).map((p) => p.playlist_id)
        return uniq(
          [
            ...filteredLocallyAddedCollectionIds,
            ...(fetchedCollectionIds || [])
          ].filter((id) => !locallyRemovedCollectionIds.has(id))
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
          if (
            (collectionType === 'albums' && !collection.is_album) ||
            (collectionType === 'playlists' && collection.is_album)
          ) {
            return false
          }
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

  const fetchMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  let status: Status
  if (isReachable) {
    status = isFetching
      ? Status.LOADING
      : isSuccess
        ? Status.SUCCESS
        : Status.ERROR
  } else {
    status = isDoneLoadingFromDisk ? Status.SUCCESS : Status.LOADING
  }

  return {
    collectionIds,
    hasMore: hasNextPage,
    fetchMore,
    status,
    isPending,
    isFetchingNextPage
  }
}
