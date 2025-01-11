import { useGetLibraryAlbums, useGetLibraryPlaylists } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  savedPageSelectors,
  SavedPageTabs,
  reachabilitySelectors
} from '@audius/common/store'
import type { CollectionType } from '@audius/common/store'
import { shallowCompare } from '@audius/common/utils'
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
const { getCollection } = cacheCollectionsSelectors
const { getCategory } = savedPageSelectors

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

  const availableCollectionIds = useProxySelector(
    (state: AppState) => {
      if (isReachable) {
        return fetchedCollectionIds ?? []
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
            collection.playlist_contents?.track_ids?.map(
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
