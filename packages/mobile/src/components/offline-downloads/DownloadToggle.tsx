import { useCallback, useMemo, useState } from 'react'

import type { DownloadReason } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Switch, Text } from 'app/components/core'
import {
  batchDownloadTrack,
  downloadCollectionById,
  DOWNLOAD_REASON_FAVORITES
} from 'app/services/offline-downloader'
import { setVisibility } from 'app/store/drawers/slice'
import {
  getOfflineDownloadStatus,
  getIsCollectionMarkedForDownload
} from 'app/store/offline-downloads/selectors'
import { OfflineTrackDownloadStatus as OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

import { DownloadStatusIndicator } from './DownloadStatusIndicator'

export type TrackForDownload = {
  trackId: number
  downloadReason: DownloadReason
}

type DownloadToggleProps = {
  tracksForDownload: TrackForDownload[]
  labelText?: string
  collectionId?: number | null
  isFavoritesDownload?: boolean
}

const messages = {
  downloading: 'Downloading'
}

const useStyles = makeStyles<{ labelText?: string }>(
  ({ palette, spacing }, props) => ({
    root: props.labelText
      ? {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: spacing(1)
        }
      : {
          flexDirection: 'row',
          alignItems: 'center'
        },
    flex1: props.labelText
      ? {
          flex: 1
        }
      : {},
    iconTitle: props.labelText
      ? {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 'auto',
          justifyContent: 'center'
        }
      : {},
    labelText: props.labelText
      ? {
          color: palette.neutralLight4,
          fontSize: 14,
          letterSpacing: 2,
          textAlign: 'center',
          textTransform: 'uppercase',
          paddingLeft: spacing(1),
          flexBasis: 'auto'
        }
      : {},
    toggleContainer: props.labelText
      ? {
          flexDirection: 'row',
          justifyContent: 'flex-end'
        }
      : {},
    purple: props.labelText
      ? {
          color: palette.secondary
        }
      : {}
  })
)

export const DownloadToggle = ({
  tracksForDownload,
  collectionId,
  labelText,
  isFavoritesDownload
}: DownloadToggleProps) => {
  const styleProps = useMemo(() => ({ labelText }), [labelText])
  const styles = useStyles(styleProps)
  const dispatch = useDispatch()
  const [disabled, setDisabled] = useState(false)
  const collectionIdStr = isFavoritesDownload
    ? DOWNLOAD_REASON_FAVORITES
    : collectionId?.toString()

  const offlineDownloadStatus = useSelector(getOfflineDownloadStatus)
  const isAnyDownloadInProgress = useMemo(
    () =>
      tracksForDownload.some(({ trackId }) => {
        const status = offlineDownloadStatus[trackId.toString()]
        return status === OfflineDownloadStatus.LOADING
      }),
    [offlineDownloadStatus, tracksForDownload]
  )
  const isCollectionMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(collectionIdStr)
  )

  const handleToggleDownload = useCallback(
    (isDownloadEnabled: boolean) => {
      if (!collectionId && !isFavoritesDownload) return
      if (isDownloadEnabled) {
        downloadCollectionById(collectionId, isFavoritesDownload)
        batchDownloadTrack(tracksForDownload)
      } else {
        if (!isFavoritesDownload && collectionIdStr) {
          // we are trying to remove download from a collection page
          dispatch(
            setVisibility({
              drawer: 'RemoveDownloadedCollection',
              visible: true,
              data: { collectionId: collectionIdStr, tracksForDownload }
            })
          )
        } else if (collectionIdStr) {
          dispatch(
            setVisibility({
              drawer: 'RemoveDownloadedFavorites',
              visible: true,
              data: { collectionId: collectionIdStr, tracksForDownload }
            })
          )
        }
      }
      setDisabled(true)
      setTimeout(() => setDisabled(false), 1000)
    },
    [
      collectionId,
      collectionIdStr,
      dispatch,
      isFavoritesDownload,
      tracksForDownload
    ]
  )

  if (!collectionId && !isFavoritesDownload) return null

  return (
    <View style={styles.root}>
      {labelText && <View style={styles.flex1} />}
      <View style={[styles.iconTitle]}>
        <DownloadStatusIndicator
          statusOverride={
            isCollectionMarkedForDownload
              ? isAnyDownloadInProgress
                ? OfflineDownloadStatus.LOADING
                : OfflineDownloadStatus.SUCCESS
              : null
          }
          showNotDownloaded
        />
        {labelText ? (
          <Text
            style={[
              styles.labelText,
              isCollectionMarkedForDownload && styles.purple
            ]}
          >
            {isAnyDownloadInProgress ? messages.downloading : labelText}
          </Text>
        ) : null}
      </View>
      <View style={[styles.flex1, styles.toggleContainer]}>
        <Switch
          value={isCollectionMarkedForDownload}
          onValueChange={handleToggleDownload}
          disabled={!collectionId || disabled}
        />
      </View>
    </View>
  )
}
