import { useMemo } from 'react'

import { cacheCollectionsSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import {
  getIsCollectionMarkedForDownload,
  getIsAnyDownloadInProgress,
  getTrackOfflineDownloadStatus,
  getIsAllDownloadsErrored
} from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import { DownloadStatusIndicator as DownloadStatusIndicatorBase } from './DownloadStatusIndicatorBase'

const { getCollection } = cacheCollectionsSelectors

type TrackDownloadIndicatorProps = {
  trackId?: number
  collectionId?: string
  size?: number
}

export const DownloadStatusIndicator = ({
  collectionId,
  trackId,
  size = 24
}: TrackDownloadIndicatorProps) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const isMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(collectionId)
  )

  const trackDownloadStatus = useSelector(
    getTrackOfflineDownloadStatus(trackId)
  )

  const collection = useSelector((state) =>
    getCollection(state, {
      id: isMarkedForDownload && collectionId ? parseInt(collectionId) : null
    })
  )

  const trackIds = useMemo(() => {
    return (
      collection?.playlist_contents?.track_ids?.map(
        (trackData) => trackData.track
      ) ?? []
    )
  }, [collection])

  const isAnyDownloadInProgress = useSelector((state) =>
    getIsAnyDownloadInProgress(state, trackIds)
  )

  const isAllDownloadsErrored = useSelector((state) =>
    getIsAllDownloadsErrored(state, trackIds)
  )

  const downloadStatus =
    trackDownloadStatus ??
    (isMarkedForDownload
      ? isAnyDownloadInProgress
        ? OfflineDownloadStatus.LOADING
        : isAllDownloadsErrored
        ? OfflineDownloadStatus.ERROR
        : OfflineDownloadStatus.SUCCESS
      : null)

  if (!isOfflineModeEnabled) return null

  return <DownloadStatusIndicatorBase status={downloadStatus} size={size} />
}
