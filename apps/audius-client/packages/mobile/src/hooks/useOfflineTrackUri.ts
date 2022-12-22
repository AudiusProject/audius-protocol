import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import {
  getLocalAudioPath,
  isAudioAvailableOffline
} from 'app/services/offline-downloader'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'

export const useOfflineTrackUri = (trackId?: string) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const offlineTracks = useSelector(getOfflineTracks)

  return useAsync(async () => {
    if (!trackId || !isOfflineModeEnabled || !offlineTracks[trackId]) return
    if (!(await isAudioAvailableOffline(trackId))) return
    const audioFilePath = getLocalAudioPath(trackId)
    return `file://${audioFilePath}`
  }, [trackId])
}
