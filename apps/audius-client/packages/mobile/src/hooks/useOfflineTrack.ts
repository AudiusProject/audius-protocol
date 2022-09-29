import type { Track } from '@audius/common'
import { FeatureFlags } from '@audius/common'
import { useAsync } from 'react-use'

import {
  getLocalAudioPath,
  isAudioAvailableOffline
} from 'app/services/offline-downloader'

import { useFeatureFlag } from './useRemoteConfig'

export const useOfflineTrackUri = (track: Track | null) => {
  const { isEnabled: isOfflineModeEnabled } = useFeatureFlag(
    FeatureFlags.OFFLINE_MODE_ENABLED
  )
  return useAsync(async () => {
    if (!track || !isOfflineModeEnabled) return
    if (!(await isAudioAvailableOffline(track))) return
    const audioFilePath = getLocalAudioPath(track)
    return `file://${audioFilePath}`
  }, [track]).value
}
