import { useEffect, useState } from 'react'

import { accountSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useLoadOfflineTracks } from 'app/hooks/useLoadOfflineTracks'
import {
  startDownloadWorker,
  startSyncWorker
} from 'app/services/offline-downloader'
import { getIsDoneLoadingFromDisk } from 'app/store/offline-downloads/selectors'

const { getUserId } = accountSelectors

export const OfflineDownloader = () => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (!initialized && isOfflineModeEnabled) {
      setInitialized(true)
      startDownloadWorker()
    }
  }, [initialized, isOfflineModeEnabled])

  useLoadOfflineTracks()

  const [syncStarted, setSyncStarted] = useState(false)
  const currentUserId = useSelector(getUserId)
  const isDoneLoadingFromDisk = useSelector(getIsDoneLoadingFromDisk)
  useEffect(() => {
    if (!syncStarted && currentUserId && isDoneLoadingFromDisk) {
      setSyncStarted(true)
      startSyncWorker()
    }
  }, [syncStarted, currentUserId, isDoneLoadingFromDisk])

  return null
}
