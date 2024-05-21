import type { ID } from '@audius/common/models'
import { useSelector } from 'react-redux'

import { getTrackDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import { DownloadStatusRowDisplay } from './DownloadStatusRowDisplay'

type TrackDownloadStatusRowProps = {
  trackId: ID
}

export const TrackDownloadStatusRow = (props: TrackDownloadStatusRowProps) => {
  const { trackId } = props

  const downloadStatus =
    useSelector((state) => getTrackDownloadStatus(state, trackId)) ??
    OfflineDownloadStatus.INACTIVE

  const showDownloadStatus =
    downloadStatus === OfflineDownloadStatus.INIT ||
    downloadStatus === OfflineDownloadStatus.LOADING ||
    downloadStatus === OfflineDownloadStatus.SUCCESS

  return showDownloadStatus ? (
    <DownloadStatusRowDisplay
      downloadStatus={downloadStatus}
      isAvailableForDownload
      isReadOnly
    />
  ) : null
}
