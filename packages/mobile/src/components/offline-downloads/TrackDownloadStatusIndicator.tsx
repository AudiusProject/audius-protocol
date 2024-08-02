import { useSelector } from 'react-redux'

import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'

import type { DownloadStatusIndicatorProps } from './DownloadStatusIndicator'
import { DownloadStatusIndicator } from './DownloadStatusIndicator'

type TrackDownloadIndicatorProps = Partial<DownloadStatusIndicatorProps> & {
  trackId?: number
}

export const TrackDownloadStatusIndicator = (
  props: TrackDownloadIndicatorProps
) => {
  const { trackId, ...other } = props
  const status = useSelector(getTrackOfflineDownloadStatus(trackId))

  return <DownloadStatusIndicator status={status} {...other} />
}
