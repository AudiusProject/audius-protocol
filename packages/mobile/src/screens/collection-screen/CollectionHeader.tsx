import { useCallback } from 'react'

import type { Collection, SmartCollectionVariant } from '@audius/common'
import {
  reachabilitySelectors,
  collectionPageSelectors,
  Variant
} from '@audius/common'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import { Switch, Text } from 'app/components/core'
import { DownloadStatusIndicator } from 'app/components/offline-downloads/DownloadStatusIndicatorBase'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useProxySelector } from 'app/hooks/useProxySelector'
import { downloadCollection } from 'app/services/offline-downloader'
import { setVisibility } from 'app/store/drawers/slice'
import { getOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
const { getCollection } = collectionPageSelectors
const { getIsReachable } = reachabilitySelectors

const messages = {
  album: 'Album',
  playlist: 'Playlist',
  empty: 'This playlist is empty.',
  privatePlaylist: 'Private Playlist',
  publishing: 'Publishing...',
  downloading: 'Downloading'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing(1)
  },
  headerLeft: {
    flex: 1
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexBasis: 'auto'
  },
  downloadStatusIndicator: {
    marginRight: spacing(2)
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  headerText: {
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  rootLegacy: {
    marginVertical: spacing(2)
  }
}))

type CollectionHeaderProps = {
  collectionId?: number | SmartCollectionVariant
}

export const CollectionHeader = (props: CollectionHeaderProps) => {
  const { collectionId } = props
  const collection = useSelector((state) =>
    getCollection(
      state,
      typeof collectionId === 'number' ? { id: collectionId } : undefined
    )
  )
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const styles = useStyles()

  const getHeaderText = () => {
    if (!collection) return messages.playlist
    if (collection.variant === Variant.SMART) return messages.playlist
    const { _is_publishing, is_album, is_private } = collection

    if (_is_publishing) return messages.publishing
    if (is_album) return messages.album
    if (is_private) return messages.privatePlaylist
    return messages.playlist
  }

  if (isOfflineModeEnabled && collection?.variant === Variant.USER_GENERATED) {
    return (
      <OfflineCollectionHeader
        headerText={getHeaderText()}
        collection={collection}
      />
    )
  }

  return (
    <View style={styles.rootLegacy}>
      <Text
        style={styles.headerText}
        color='neutralLight4'
        weight='demiBold'
        fontSize='small'
      >
        {getHeaderText()}
      </Text>
    </View>
  )
}

type OfflineCollectionHeaderProps = {
  collection: Collection
  headerText: string
}

const OfflineCollectionHeader = (props: OfflineCollectionHeaderProps) => {
  const styles = useStyles()
  const { collection, headerText } = props
  const { playlist_id, playlist_contents } = collection
  const { track_ids } = playlist_contents
  const dispatch = useDispatch()
  const isReachable = useSelector(getIsReachable)

  const isMarkedForDownload = useProxySelector(
    (state) => {
      const { collections, favoritedCollections } = state.offlineDownloads
      return collections[playlist_id] || favoritedCollections[playlist_id]
    },
    [playlist_id]
  )

  const isDownloaded = useProxySelector(
    (state) => {
      const trackIds = track_ids.map(({ track }) => track)
      const downloadStatus = getOfflineDownloadStatus(state)
      return trackIds.every(
        (trackId) => downloadStatus[trackId] === OfflineDownloadStatus.SUCCESS
      )
    },
    [track_ids]
  )

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
        downloadCollection(collection)
      } else {
        dispatch(
          setVisibility({
            drawer: 'RemoveDownloadedCollection',
            visible: true,
            data: { collectionId: playlist_id }
          })
        )
      }
    },
    [collection, dispatch, playlist_id]
  )

  return (
    <View style={styles.root}>
      <View style={styles.headerLeft} />
      <View style={styles.headerCenter}>
        <DownloadStatusIndicator
          status={downloadStatus}
          style={styles.downloadStatusIndicator}
        />
        <Text
          style={styles.headerText}
          color={
            downloadStatus === OfflineDownloadStatus.INACTIVE
              ? 'neutralLight4'
              : 'secondary'
          }
          weight='demiBold'
          fontSize='small'
        >
          {downloadStatus === OfflineDownloadStatus.LOADING
            ? messages.downloading
            : headerText}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <Switch
          value={isMarkedForDownload}
          onValueChange={handleToggleDownload}
          disabled={isMarkedForDownload || !isReachable}
        />
      </View>
    </View>
  )
}
