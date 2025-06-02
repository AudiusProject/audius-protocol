import { useCollection } from '@audius/common/api'
import type { Collection } from '@audius/common/models'
import { removeNullable } from '@audius/common/utils'
import { pick } from 'lodash'
import { useSelector } from 'react-redux'

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
  collection: Pick<Collection, 'playlist_id' | 'playlist_contents'> | undefined
): OfflineDownloadStatus | null => {
  if (!collection) return OfflineDownloadStatus.INACTIVE

  const { playlist_id: collectionId } = collection

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
  const { data: collection } = useCollection(collectionId, {
    select: (collection) =>
      pick(collection, ['playlist_id', 'playlist_contents'])
  })

  const status = useSelector((state) =>
    getCollectionDownloadStatus(state, collection)
  )

  return <DownloadStatusIndicator status={status} {...other} />
}
