import { useCallback, useEffect, useState } from 'react'

import { reachabilitySelectors } from '@audius/common'
import queue from 'react-native-job-queue'
import { useSelector } from 'react-redux'

import {
  useIsOfflineModeEnabled,
  useReadOfflineOverride
} from 'app/hooks/useIsOfflineModeEnabled'
import { useLoadOfflineData } from 'app/hooks/useLoadOfflineTracks'
import { startDownloadWorker } from 'app/services/offline-downloader'

const { getIsReachable } = reachabilitySelectors

export const OfflineDownloader = () => {
  useReadOfflineOverride()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const [initialized, setInitialized] = useState(false)

  const initialize = useCallback(async () => {
    try {
      await startDownloadWorker()
    } catch (e) {
      console.warn('Download worker failed to start', e)
      return
    }
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized && isOfflineModeEnabled) {
      initialize()
    }
  }, [initialize, initialized, isOfflineModeEnabled])

  useLoadOfflineData()

  const isReachable = useSelector(getIsReachable)

  useEffect(() => {
    if (!initialized) return

    if (isReachable) {
      queue.start()
    } else if (!isReachable) {
      queue.stop()
    }
  }, [initialized, isReachable])

  return null
}
