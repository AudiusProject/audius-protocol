import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineTrackDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

import IconDownload from '../../assets/images/iconDownloadPurple.svg'
import IconDownloading from '../../assets/images/iconDownloading.svg'
import IconNotDownloaded from '../../assets/images/iconNotDownloaded.svg'
import LoadingSpinner from '../loading-spinner'

type TrackDownloadIndicatorProps = {
  trackId?: string
  statusOverride?: OfflineTrackDownloadStatus | null
  showNotDownloaded?: boolean
}

const useStyles = makeStyles(() => ({
  // TODO: replace with animated icon
  loadingSpinner: {
    position: 'absolute',
    height: 11,
    width: 11,
    top: 2.2,
    left: 2.2
  }
}))

export const DownloadStatusIndicator = ({
  trackId,
  statusOverride,
  showNotDownloaded
}: TrackDownloadIndicatorProps) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const styles = useStyles()

  const trackDownloadStatus = useSelector(
    getTrackOfflineDownloadStatus(trackId)
  )
  const downloadStatus = statusOverride ?? trackDownloadStatus

  if (!isOfflineModeEnabled) return null

  switch (downloadStatus) {
    case OfflineTrackDownloadStatus.LOADING:
      return (
        <View>
          <IconDownloading />
          <LoadingSpinner style={styles.loadingSpinner} />
        </View>
      )
    case OfflineTrackDownloadStatus.SUCCESS:
      return <IconDownload />
    default:
      return showNotDownloaded ? <IconNotDownloaded /> : null
  }
}
