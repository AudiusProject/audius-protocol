import { useMemo } from 'react'

import { cacheCollectionsSelectors } from '@audius/common'
import LottieView from 'lottie-react-native'
import { useSelector } from 'react-redux'

import iconDownloading from 'app/assets/animations/iconDownloading.json'
import IconDownloadFailed from 'app/assets/images/iconDownloadFailed.svg'
import IconDownload from 'app/assets/images/iconDownloadPurple.svg'
import IconNotDownloaded from 'app/assets/images/iconNotDownloaded.svg'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import {
  getIsCollectionMarkedForDownload,
  getIsAnyDownloadInProgress,
  getTrackOfflineDownloadStatus,
  getIsAllDownloadsErrored
} from 'app/store/offline-downloads/selectors'
import { OfflineTrackDownloadStatus } from 'app/store/offline-downloads/slice'

const { getCollection } = cacheCollectionsSelectors

type TrackDownloadIndicatorProps = {
  trackId?: number
  collectionId?: string
  statusOverride?: OfflineTrackDownloadStatus | null
  showNotDownloaded?: boolean
  size?: number
}

export const DownloadStatusIndicator = ({
  collectionId,
  trackId,
  statusOverride,
  showNotDownloaded,
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
    statusOverride ??
    trackDownloadStatus ??
    (isMarkedForDownload
      ? isAnyDownloadInProgress
        ? OfflineTrackDownloadStatus.LOADING
        : isAllDownloadsErrored
        ? OfflineTrackDownloadStatus.ERROR
        : OfflineTrackDownloadStatus.SUCCESS
      : null)

  if (!isOfflineModeEnabled) return null

  switch (downloadStatus) {
    case OfflineTrackDownloadStatus.LOADING:
      return (
        <LottieView
          style={{
            height: size,
            width: size
          }}
          source={iconDownloading}
          autoPlay
          loop
        />
      )
    case OfflineTrackDownloadStatus.SUCCESS:
      return <IconDownload height={size} width={size} />
    case OfflineTrackDownloadStatus.ERROR:
      // TODO: clickable to retry
      return <IconDownloadFailed height={size} width={size} />
    default:
      return showNotDownloaded ? (
        <IconNotDownloaded height={size} width={size} />
      ) : null
  }
}
