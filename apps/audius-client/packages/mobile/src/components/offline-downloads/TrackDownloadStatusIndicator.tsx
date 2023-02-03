import { useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'

import type { DownloadStatusIndicatorProps } from './DownloadStatusIndicator'
import { DownloadStatusIndicator } from './DownloadStatusIndicator'

type TrackDownloadIndicatorProps = Partial<DownloadStatusIndicatorProps> & {
  trackId?: number
  size?: number
}

export const TrackDownloadStatusIndicator = (
  props: TrackDownloadIndicatorProps
) => {
  const { trackId, ...other } = props
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const status = useSelector(getTrackOfflineDownloadStatus(trackId))

  if (!isOfflineModeEnabled) return null
  return <DownloadStatusIndicator status={status} {...other} />
}
