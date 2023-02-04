import { useCallback } from 'react'

import { reachabilitySelectors } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Switch } from 'app/components/core'
import { DownloadStatusIndicator } from 'app/components/offline-downloads/DownloadStatusIndicator'
import { useDebouncedCallback } from 'app/hooks/useDebouncedCallback'
import { useProxySelector } from 'app/hooks/useProxySelector'
import {
  downloadAllFavorites,
  DOWNLOAD_REASON_FAVORITES
} from 'app/services/offline-downloader'
import { setVisibility } from 'app/store/drawers/slice'
import { getOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
const { getIsReachable } = reachabilitySelectors

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadStatusIndicator: {
    marginRight: spacing(1)
  }
}))

export const DownloadFavoritesSwitch = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const isReachable = useSelector(getIsReachable)

  const isMarkedForDownload = useProxySelector((state) => {
    const { collectionStatus, favoritedCollectionStatus } =
      state.offlineDownloads
    return !!(
      collectionStatus[DOWNLOAD_REASON_FAVORITES] ||
      favoritedCollectionStatus[DOWNLOAD_REASON_FAVORITES]
    )
  }, [])

  const isDownloaded = useProxySelector((state) => {
    const downloadStatus = getOfflineDownloadStatus(state)
    const tracksToDownload = Object.keys(downloadStatus)
    if (tracksToDownload.length === 0) return false

    const hasRemainingDownloads = tracksToDownload.some(
      (trackId) =>
        downloadStatus[trackId] === OfflineDownloadStatus.LOADING ||
        downloadStatus[trackId] === OfflineDownloadStatus.INIT
    )

    if (hasRemainingDownloads) return false

    // Since downloadStatus can take a while to populate, use favorited
    // tracks lineup as a backup
    const favoritedTracks = state.pages.savedPage.tracks.entries
    return favoritedTracks.every(({ id }) => {
      return (
        downloadStatus[id] === OfflineDownloadStatus.SUCCESS ||
        downloadStatus[id] === OfflineDownloadStatus.ERROR ||
        downloadStatus[id] === OfflineDownloadStatus.ABANDONED
      )
    })
  }, [])

  const getDownloadStatus = () => {
    if (!isMarkedForDownload) {
      return OfflineDownloadStatus.INACTIVE
    }
    if (isDownloaded) {
      return OfflineDownloadStatus.SUCCESS
    }
    return OfflineDownloadStatus.LOADING
  }

  const downloadStatus = getDownloadStatus()

  const handleToggleDownload = useCallback(
    (isDownloadEnabled: boolean) => {
      if (isDownloadEnabled) {
        downloadAllFavorites()
      } else {
        dispatch(
          setVisibility({
            drawer: 'RemoveDownloadedFavorites',
            visible: true
          })
        )
      }
    },
    [dispatch]
  )

  const debouncedHandleToggleDownload = useDebouncedCallback(
    handleToggleDownload,
    800
  )

  return (
    <View style={styles.root}>
      <DownloadStatusIndicator
        status={downloadStatus}
        style={styles.downloadStatusIndicator}
      />
      <Switch
        defaultValue={isMarkedForDownload}
        onValueChange={debouncedHandleToggleDownload}
        disabled={!isReachable && !isMarkedForDownload}
      />
    </View>
  )
}
