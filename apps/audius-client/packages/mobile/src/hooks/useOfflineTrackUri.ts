import { FeatureFlags } from '@audius/common'
import { useAsync } from 'react-use'

import {
  getLocalAudioPath,
  isAudioAvailableOffline
} from 'app/services/offline-downloader'

import { useFeatureFlag } from './useRemoteConfig'

export const useOfflineTrackUri = (trackId?: string) => {
  const { isEnabled: isOfflineModeEnabled } = useFeatureFlag(
    FeatureFlags.OFFLINE_MODE_ENABLED
  )
  return useAsync(async () => {
    if (!trackId || !isOfflineModeEnabled) return
    if (!(await isAudioAvailableOffline(trackId))) return
    const audioFilePath = getLocalAudioPath(trackId)
    return `file://${audioFilePath}`
  }, [trackId])
}
