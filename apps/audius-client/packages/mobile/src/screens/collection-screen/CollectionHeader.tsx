import { useCallback, useEffect, useState } from 'react'

import type { Collection, SmartCollectionVariant } from '@audius/common'
import {
  accountSelectors,
  reachabilitySelectors,
  collectionPageSelectors,
  Variant
} from '@audius/common'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import { Switch, Text } from 'app/components/core'
import { getCollectionDownloadStatus } from 'app/components/offline-downloads/CollectionDownloadStatusIndicator'
import { DownloadStatusIndicator } from 'app/components/offline-downloads/DownloadStatusIndicator'
import { useDebouncedCallback } from 'app/hooks/useDebouncedCallback'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useProxySelector } from 'app/hooks/useProxySelector'
import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { getVisibility } from 'app/store/drawers/selectors'
import { setVisibility } from 'app/store/drawers/slice'
import { getIsCollectionMarkedForDownload } from 'app/store/offline-downloads/selectors'
import {
  OfflineDownloadStatus,
  requestDownloadCollection
} from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
const { getCollection } = collectionPageSelectors
const { getIsReachable } = reachabilitySelectors
const { getUserId } = accountSelectors

const messages = {
  album: 'Album',
  playlist: 'Playlist',
  empty: 'This playlist is empty.',
  privatePlaylist: 'Private Playlist',
  publishing: 'Publishing...',
  queued: 'Download Queued',
  downloading: 'Downloading'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(2)
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
    marginTop: spacing(4),
    marginBottom: spacing(4),
    letterSpacing: 2,
    lineHeight: 17,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  rootLegacy: {
    marginTop: spacing(2),
    marginBottom: spacing(3)
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
  const { playlist_id } = collection
  const dispatch = useDispatch()
  const isReachable = useSelector(getIsReachable)
  const currentUserId = useSelector(getUserId)

  const isMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(playlist_id)
  )

  const isFavoritesToggleOn = useSelector(
    getIsCollectionMarkedForDownload(DOWNLOAD_REASON_FAVORITES)
  )

  const downloadStatus = useProxySelector(
    (state) => {
      const status = getCollectionDownloadStatus(state, playlist_id)
      return isMarkedForDownload ? status : OfflineDownloadStatus.INACTIVE
    },
    [isMarkedForDownload, playlist_id]
  )

  const [downloadSwitchValue, setDownloadSwitchValue] =
    useState(isMarkedForDownload)
  const removeDrawerVisibility = useSelector(
    getVisibility('RemoveDownloadedCollection')
  )

  const showDownloadSwitchAndIndicator =
    collection.has_current_user_saved ||
    collection.playlist_owner_id === currentUserId

  useEffect(() => {
    if (
      removeDrawerVisibility !== true &&
      isMarkedForDownload !== downloadSwitchValue
    ) {
      setDownloadSwitchValue(isMarkedForDownload)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarkedForDownload, removeDrawerVisibility])

  const handleToggleDownload = useCallback(
    (isDownloadEnabled: boolean) => {
      if (isDownloadEnabled) {
        dispatch(requestDownloadCollection({ collectionId: playlist_id }))
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
    [dispatch, playlist_id]
  )

  const debouncedHandleToggleDownload = useDebouncedCallback(
    handleToggleDownload,
    800
  )

  const handleDownloadSwitchChange = (isEnabled: boolean) => {
    setDownloadSwitchValue(isEnabled)
    debouncedHandleToggleDownload(isEnabled)
  }

  const getTextColor = () => {
    if (
      downloadStatus === OfflineDownloadStatus.LOADING ||
      downloadStatus === OfflineDownloadStatus.SUCCESS
    ) {
      return 'secondary'
    }
    return 'neutralLight4'
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerLeft} />
      <View style={styles.headerCenter}>
        {showDownloadSwitchAndIndicator ? (
          <DownloadStatusIndicator
            status={downloadStatus}
            style={styles.downloadStatusIndicator}
          />
        ) : null}
        <Text
          style={styles.headerText}
          color={getTextColor()}
          weight='demiBold'
          fontSize='small'
        >
          {downloadStatus === OfflineDownloadStatus.LOADING
            ? messages.downloading
            : headerText}
        </Text>
      </View>
      <View style={styles.headerRight}>
        {showDownloadSwitchAndIndicator ? (
          <Switch
            value={downloadSwitchValue}
            onValueChange={handleDownloadSwitchChange}
            disabled={
              isFavoritesToggleOn || (!isReachable && !isMarkedForDownload)
            }
          />
        ) : null}
      </View>
    </View>
  )
}
