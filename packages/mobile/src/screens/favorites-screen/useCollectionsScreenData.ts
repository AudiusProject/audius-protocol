import { useMemo } from 'react'

import type { CollectionType } from '@audius/common'
import {
  Status,
  statusIsNotFinalized,
  cacheCollectionsSelectors,
  filterCollections,
  reachabilitySelectors,
  shallowCompare,
  useFetchedSavedCollections,
  useProxySelector,
  useAccountAlbums,
  useAccountPlaylists
} from '@audius/common'
import { useSelector } from 'react-redux'

import { useOfflineTracksStatus } from 'app/hooks/useOfflineTrackStatus'
import type { AppState } from 'app/store'
import {
  getIsDoneLoadingFromDisk,
  getOfflineCollectionsStatus
} from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

const { getIsReachable } = reachabilitySelectors
const { getCollection } = cacheCollectionsSelectors

type UseCollectionsScreenDataConfig = {
  filterValue?: string
  collectionType: CollectionType
}

export const useCollectionsScreenData = ({
  collectionType,
  filterValue = ''
}: UseCollectionsScreenDataConfig) => {
  const isDoneLoadingFromDisk = useSelector(getIsDoneLoadingFromDisk)
  const isReachable = useSelector(getIsReachable)
  const offlineTracksStatus = useOfflineTracksStatus({ skipIfOnline: true })

  const accountAlbums = useAccountAlbums()
  const accountPlaylists = useAccountPlaylists()

  const { data: unfilteredCollections, status: accountCollectionsStatus } =
    collectionType === 'albums' ? accountAlbums : accountPlaylists

  const collectionIds = useMemo(
    () =>
      filterCollections(unfilteredCollections, {
        filterText: filterValue
      }).map((c) => c.id),
    [unfilteredCollections, filterValue]
  )

  const {
    data: fetchedCollectionIds,
    fetchMore,
    hasMore,
    status: fetchedStatus
  } = useFetchedSavedCollections({
    collectionIds,
    type: collectionType,
    pageSize: 20
  })

  const availableCollectionIds = useProxySelector(
    (state: AppState) => {
      if (isReachable) {
        return fetchedCollectionIds
      }

      if (!isDoneLoadingFromDisk) {
        return []
      }

      return fetchedCollectionIds.filter((collectionId) => {
        const collection = getCollection(state, { id: collectionId })
        if (collection == null) {
          console.error(
            `Unexpected missing fetched collection: ${collectionId}`
          )
          return false
        }

        if (!isReachable) {
          const offlineCollectionsStatus = getOfflineCollectionsStatus(state)
          const trackIds =
            collection.playlist_contents.track_ids.map(
              (trackData) => trackData.track
            ) ?? []
          const collectionDownloadStatus =
            offlineCollectionsStatus[collection.playlist_id]
          // Don't show a playlist in Offline Mode if it has at least one track but none of the tracks have been downloaded yet OR if it is not marked for download
          return (
            Boolean(collectionDownloadStatus) &&
            collectionDownloadStatus !== OfflineDownloadStatus.INACTIVE &&
            (trackIds.length === 0 ||
              trackIds.some((t) => {
                return (
                  offlineTracksStatus &&
                  offlineTracksStatus[t.toString()] ===
                    OfflineDownloadStatus.SUCCESS
                )
              }))
          )
        }
        return true
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

  // Fetching won't be triggered if the user has no saved collections, so short-circuit to Success
  const status =
    !statusIsNotFinalized(accountCollectionsStatus) &&
    unfilteredCollections.length === 0
      ? Status.SUCCESS
      : fetchedStatus

  return {
    accountCollectionsStatus,
    collectionIds: availableCollectionIds,
    hasMore,
    fetchMore,
    status
  }
}
