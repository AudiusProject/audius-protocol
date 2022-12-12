import LottieView from 'lottie-react-native'
import { useSelector } from 'react-redux'

import iconDownloading from 'app/assets/animations/iconDownloading.json'
import IconDownloadFailed from 'app/assets/images/iconDownloadFailed.svg'
import IconDownload from 'app/assets/images/iconDownloadPurple.svg'
import IconNotDownloaded from 'app/assets/images/iconNotDownloaded.svg'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineTrackDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

type TrackDownloadIndicatorProps = {
  trackId?: string
  statusOverride?: OfflineTrackDownloadStatus | null
  showNotDownloaded?: boolean
  size?: number
}

const useStyles = makeStyles<Pick<TrackDownloadIndicatorProps, 'size'>>(
  (_, { size }) => ({
    icon: {
      height: size,
      width: size
    }
  })
)

export const DownloadStatusIndicator = ({
  trackId,
  statusOverride,
  showNotDownloaded,
  size = 24
}: TrackDownloadIndicatorProps) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const styles = useStyles({ size })

  const trackDownloadStatus = useSelector(
    getTrackOfflineDownloadStatus(trackId)
  )
  const downloadStatus = statusOverride ?? trackDownloadStatus

  if (!isOfflineModeEnabled) return null

  switch (downloadStatus) {
    case OfflineTrackDownloadStatus.LOADING:
      return (
        <LottieView
          style={styles.icon}
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
