import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { getItemOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineItemDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

import IconDownload from '../../assets/images/iconDownloadPurple.svg'
import IconDownloading from '../../assets/images/iconDownloading.svg'
import IconNotDownloaded from '../../assets/images/iconNotDownloaded.svg'
import LoadingSpinner from '../loading-spinner'

type TrackDownloadIndicatorProps = {
  itemId: string
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
  itemId,
  showNotDownloaded
}: TrackDownloadIndicatorProps) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const downloadStatus = useSelector(getItemOfflineDownloadStatus(itemId))
  const styles = useStyles()

  if (!isOfflineModeEnabled) return null

  switch (downloadStatus) {
    case OfflineItemDownloadStatus.LOADING:
      return (
        <View>
          <IconDownloading />
          <LoadingSpinner style={styles.loadingSpinner} />
        </View>
      )
    case OfflineItemDownloadStatus.SUCCESS:
      return <IconDownload />
    default:
      return showNotDownloaded ? <IconNotDownloaded /> : null
  }
}
