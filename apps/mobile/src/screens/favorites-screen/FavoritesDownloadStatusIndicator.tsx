import { DownloadStatusIndicator } from 'app/components/offline-downloads'
import { useProxySelector } from 'app/hooks/useProxySelector'
import type { AppState } from 'app/store'
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'
import { getOfflineTrackStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginRight: spacing(1)
  }
}))

const getFavoritesDownloadStatus = (state: AppState) => {
  const { collectionStatus } = state.offlineDownloads
  const favoritedCollectionStatus = collectionStatus[DOWNLOAD_REASON_FAVORITES]

  if (!favoritedCollectionStatus) {
    return OfflineDownloadStatus.INACTIVE
  }

  if (favoritedCollectionStatus === OfflineDownloadStatus.INIT) {
    return OfflineDownloadStatus.LOADING
  }

  const downloadStatus = getOfflineTrackStatus(state)
  const tracksToDownload = Object.keys(downloadStatus)

  const hasRemainingDownloads = tracksToDownload?.some(
    (trackId) =>
      downloadStatus[trackId] === OfflineDownloadStatus.LOADING ||
      downloadStatus[trackId] === OfflineDownloadStatus.INIT
  )

  if (hasRemainingDownloads) return OfflineDownloadStatus.LOADING

  return OfflineDownloadStatus.SUCCESS
}

type FavoritesDownloadStatusIndicatorProps = {
  switchValue: boolean
}

export const FavoritesDownloadStatusIndicator = (
  props: FavoritesDownloadStatusIndicatorProps
) => {
  const { switchValue } = props
  const styles = useStyles()
  const downloadStatus = useProxySelector(getFavoritesDownloadStatus, [])

  return (
    <DownloadStatusIndicator
      status={
        switchValue && downloadStatus === OfflineDownloadStatus.INACTIVE
          ? OfflineDownloadStatus.LOADING
          : downloadStatus
      }
      style={styles.root}
    />
  )
}
