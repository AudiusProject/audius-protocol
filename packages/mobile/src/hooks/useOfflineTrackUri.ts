import { useAsync } from 'react-use'

import {
  getLocalAudioPath,
  isAudioAvailableOffline
} from 'app/services/offline-downloader'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'

export const useOfflineTrackUri = (trackId?: string) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  return useAsync(async () => {
    if (!trackId || !isOfflineModeEnabled) return
    if (!(await isAudioAvailableOffline(trackId))) return
    const audioFilePath = getLocalAudioPath(trackId)
    return `file://${audioFilePath}`
  }, [trackId])
}
