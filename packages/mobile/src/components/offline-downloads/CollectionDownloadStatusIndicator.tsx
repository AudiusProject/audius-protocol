import { getCollectionQueryKey } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { removeNullable } from '@audius/common/utils'

import { useProxySelector } from 'app/hooks/useProxySelector'
import { queryClient } from 'app/services/query-client'
import type { AppState } from 'app/store'
import {
  getIsCollectionMarkedForDownload,
  getTrackOfflineDownloadStatus
} from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import type { DownloadStatusIndicatorProps } from './DownloadStatusIndicator'
import { DownloadStatusIndicator } from './DownloadStatusIndicator'

type CollectionDownloadIndicatorProps =
  Partial<DownloadStatusIndicatorProps> & {
    collectionId?: number
  }

export const getCollectionDownloadStatus = (
  state: AppState,
  collectionId?: ID
): OfflineDownloadStatus | null => {
  const collection = queryClient.getQueryData(
    getCollectionQueryKey(collectionId)
  )
  if (!collection) return OfflineDownloadStatus.INACTIVE

  const isMarkedForDownload =
    getIsCollectionMarkedForDownload(collectionId)(state)

  if (!isMarkedForDownload) return null

  const playlistTracks = collection.playlist_contents.track_ids
  if (playlistTracks.length === 0) return OfflineDownloadStatus.SUCCESS

  const trackStatuses = playlistTracks
    .map(({ track: trackId }) => getTrackOfflineDownloadStatus(trackId)(state))
    .filter(removeNullable)

  if (trackStatuses.length === 0) return OfflineDownloadStatus.INIT

  if (trackStatuses.every((status) => status === OfflineDownloadStatus.INIT))
    return OfflineDownloadStatus.INIT

  if (trackStatuses.some((status) => status === OfflineDownloadStatus.LOADING))
    return OfflineDownloadStatus.LOADING

  if (
    trackStatuses.every(
      (status) =>
        status === OfflineDownloadStatus.SUCCESS ||
        status === OfflineDownloadStatus.ERROR ||
        status === OfflineDownloadStatus.ABANDONED
    )
  )
    return OfflineDownloadStatus.SUCCESS

  if (
    trackStatuses.every(
      (status) =>
        status === OfflineDownloadStatus.ERROR ||
        status === OfflineDownloadStatus.ABANDONED
    )
  )
    return OfflineDownloadStatus.ERROR

  if (
    trackStatuses.every(
      (status) =>
        status === OfflineDownloadStatus.INIT ||
        status === OfflineDownloadStatus.SUCCESS ||
        status === OfflineDownloadStatus.ERROR ||
        status === OfflineDownloadStatus.ABANDONED
    )
  )
    return OfflineDownloadStatus.LOADING

  return OfflineDownloadStatus.INIT
}

export const CollectionDownloadStatusIndicator = (
  props: CollectionDownloadIndicatorProps
) => {
  const { collectionId, ...other } = props

  const status = useProxySelector(
    (state) => getCollectionDownloadStatus(state, collectionId),
    [collectionId]
  )

  return <DownloadStatusIndicator status={status} {...other} />
}
