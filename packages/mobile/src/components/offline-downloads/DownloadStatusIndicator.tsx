import { useMemo } from 'react'

import { cacheCollectionsSelectors } from '@audius/common'
import { useSelector } from 'react-redux'
import Rive from 'rive-react-native'

import IconDownloadFailed from 'app/assets/images/iconDownloadFailed.svg'
import IconDownloadInactive from 'app/assets/images/iconDownloadInactive.svg'
import IconDownloadQueued from 'app/assets/images/iconDownloadQueued.svg'
import IconDownloaded from 'app/assets/images/iconDownloaded.svg'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import {
  getIsCollectionMarkedForDownload,
  getIsAnyDownloadInProgress,
  getTrackOfflineDownloadStatus,
  getIsAllDownloadsErrored
} from 'app/store/offline-downloads/selectors'
import { OfflineTrackDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
import { useThemeVariant } from 'app/utils/theme'

const { getCollection } = cacheCollectionsSelectors

type TrackDownloadIndicatorProps = {
  trackId?: number
  collectionId?: string
  statusOverride?: OfflineTrackDownloadStatus | null
  showNotDownloaded?: boolean
  size?: number
}

const useStyles = makeStyles(({ palette }) => ({
  iconDownloadQueued: {
    fill: palette.neutralLight4
  },
  iconDownloaded: {
    fill: palette.secondary
  },
  iconDownloadFailed: {
    fill: palette.secondary
  },
  iconDownloadInactive: {
    fill: palette.neutralLight4
  }
}))

export const DownloadStatusIndicator = ({
  collectionId,
  trackId,
  statusOverride,
  showNotDownloaded,
  size = 24
}: TrackDownloadIndicatorProps) => {
  const styles = useStyles()
  const themeVariant = useThemeVariant()
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
    case OfflineTrackDownloadStatus.INIT:
      return (
        <IconDownloadQueued
          fill={styles.iconDownloadQueued.fill}
          height={size}
          width={size}
        />
      )
    case OfflineTrackDownloadStatus.LOADING:
      return (
        <Rive
          style={{
            height: size,
            width: size
          }}
          resourceName={`downloading_${themeVariant}`}
          autoplay
        />
      )
    case OfflineTrackDownloadStatus.SUCCESS:
      return (
        <IconDownloaded
          fill={styles.iconDownloaded.fill}
          height={size}
          width={size}
        />
      )
    case OfflineTrackDownloadStatus.ERROR:
      // TODO: clickable to retry
      return (
        <IconDownloadFailed
          fill={styles.iconDownloadFailed.fill}
          height={size}
          width={size}
        />
      )
    default:
      return showNotDownloaded ? (
        <IconDownloadInactive
          fill={styles.iconDownloadInactive.fill}
          height={size}
          width={size}
        />
      ) : null
  }
}
