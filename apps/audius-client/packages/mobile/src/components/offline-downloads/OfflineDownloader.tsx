import { useEffect, useState } from 'react'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { startDownloadWorker } from 'app/services/offline-downloader/offline-download-queue'

export const OfflineDownloader = () => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (!initialized && isOfflineModeEnabled) {
      setInitialized(true)
      startDownloadWorker()
    }
  }, [initialized, isOfflineModeEnabled])

  return null
}
