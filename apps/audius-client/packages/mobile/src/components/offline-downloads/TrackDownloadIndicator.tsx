import { FeatureFlags } from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { TrackDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

import IconDownload from '../../assets/images/iconDownloadPurple.svg'
import IconDownloading from '../../assets/images/iconDownloading.svg'
import LoadingSpinner from '../loading-spinner'

type TrackDownloadIndicatorProps = {
  trackId: string
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

export const TrackDownloadIndicator = ({
  trackId
}: TrackDownloadIndicatorProps) => {
  const { isEnabled: isOfflineModeEnabled } = useFeatureFlag(
    FeatureFlags.OFFLINE_MODE_ENABLED
  )
  const downloadStatus = useSelector(getTrackOfflineDownloadStatus(trackId))
  const styles = useStyles()

  if (!isOfflineModeEnabled) return null

  switch (downloadStatus) {
    case TrackDownloadStatus.LOADING:
      return (
        <View>
          <IconDownloading />
          <LoadingSpinner style={styles.loadingSpinner} />
        </View>
      )
    case TrackDownloadStatus.SUCCESS:
      return <IconDownload />
    default:
      return null
  }
}
