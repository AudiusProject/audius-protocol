import { useGetPlaylistById } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { useProxySelector } from 'app/hooks/useProxySelector'
import { getTrackDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import { DownloadStatusRowDisplay } from './DownloadStatusRowDisplay'
const { getUserId } = accountSelectors

type TrackDownloadStatusRowProps = {
  trackId: ID
}

export const TrackDownloadStatusRow = (props: TrackDownloadStatusRowProps) => {
  const { trackId } = props
  const currentUserId = useSelector(getUserId)

  const { data: track } = useGetPlaylistById({
    playlistId: trackId,
    currentUserId
  })

  const downloadStatus = useProxySelector(
    (state) => {
      const status =
        getTrackDownloadStatus(state, trackId) ?? OfflineDownloadStatus.INACTIVE

      return status === OfflineDownloadStatus.INACTIVE
        ? OfflineDownloadStatus.INIT
        : status
    },
    [trackId]
  )
  const isAvailableForDownload =
    track &&
    (track.has_current_user_saved || track.playlist_owner_id === currentUserId)

  return (
    <DownloadStatusRowDisplay
      downloadStatus={downloadStatus}
      isAvailableForDownload={isAvailableForDownload}
      isReadOnly={true}
    />
  )
}
