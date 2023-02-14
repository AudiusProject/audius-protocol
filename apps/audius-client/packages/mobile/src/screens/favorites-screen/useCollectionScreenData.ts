import { useMemo } from 'react'

import {
  reachabilitySelectors,
  shallowCompare,
  useProxySelector
} from '@audius/common'
import { useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import type { AppState } from 'app/store'
import {
  getIsDoneLoadingFromDisk,
  getOfflineCollectionsStatus,
  getOfflineTrackStatus
} from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import { getAccountCollections } from './selectors'
import { buildCollectionIdsToNumPlayableTracksMap } from './utils'

const { getIsReachable } = reachabilitySelectors

export const useCollectionScreenData = (
  filterValue = '',
  collectionType: 'albums' | 'playlists'
) => {
  const isDoneLoadingFromDisk = useSelector(getIsDoneLoadingFromDisk)
  const isReachable = useSelector(getIsReachable)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const offlineTracksStatus = useProxySelector(
    (state: AppState) => {
      if (isDoneLoadingFromDisk && isOfflineModeEnabled && !isReachable) {
        return getOfflineTrackStatus(state)
      }
      // We don't need offline download status when we're not offline. This saves us rerenders while we're downloading things and updating the offline download slice.
      return undefined
    },
    [isReachable, isOfflineModeEnabled, isDoneLoadingFromDisk]
  )

  const filteredCollections = useProxySelector(
    (state: AppState) => {
      if (isOfflineModeEnabled && !isReachable) {
        if (!isDoneLoadingFromDisk) {
          return []
        }
      }
      const offlineCollectionsStatus = getOfflineCollectionsStatus(state)
      return getAccountCollections(state, filterValue).filter((collection) => {
        const isCollectionCorrectType =
          collectionType === 'albums'
            ? collection.is_album
            : !collection.is_album
        if (!isCollectionCorrectType) {
          return false
        }
        if (isOfflineModeEnabled && !isReachable) {
          const trackIds =
            collection.playlist_contents.track_ids.map(
              (trackData) => trackData.track
            ) ?? []
          const collectionDownloadStatus =
            offlineCollectionsStatus[collection.playlist_id]
          // Don't show a playlist in Offline Mode if it has at least one track but none of the tracks have been downloaded yet OR if it is not marked for download
          return (
            isCollectionCorrectType &&
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
      filterValue,
      isReachable,
      isOfflineModeEnabled,
      isDoneLoadingFromDisk,
      offlineTracksStatus
    ],
    shallowCompare
  )
  const numPlayableTracksMap = useMemo(() => {
    return buildCollectionIdsToNumPlayableTracksMap(
      filteredCollections,
      isOfflineModeEnabled && !isReachable,
      offlineTracksStatus || {}
    )
  }, [
    isOfflineModeEnabled,
    isReachable,
    offlineTracksStatus,
    filteredCollections
  ])

  return {
    filteredCollections,
    collectionIdsToNumTracks: numPlayableTracksMap
  }
}
