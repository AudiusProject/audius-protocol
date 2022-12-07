import { useCallback, useMemo } from 'react'

import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { Switch, Text } from 'app/components/core'
import {
  downloadCollection,
  removeCollectionDownload
} from 'app/services/offline-downloader'
import {
  getOfflineDownloadStatus,
  getIsCollectionMarkedForDownload
} from 'app/store/offline-downloads/selectors'
import { OfflineTrackDownloadStatus as OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

import { DownloadStatusIndicator } from './DownloadStatusIndicator'

type DownloadToggleProps = {
  collection?: string
  labelText?: string
  trackIds: number[]
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
  trackIds,
  collection,
  labelText
}: DownloadToggleProps) => {
  const styles = useStyles({ labelText })

  const offlineDownloadStatus = useSelector(getOfflineDownloadStatus)
  const isAnyDownloadInProgress = useMemo(
    () =>
      trackIds.some((trackId: number) => {
        const status = offlineDownloadStatus[trackId.toString()]
        return status === OfflineDownloadStatus.LOADING
      }),
    [offlineDownloadStatus, trackIds]
  )
  const isCollectionMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(collection)
  )
  const handleToggleDownload = useCallback(
    (isDownloadEnabled: boolean) => {
      if (!collection) return
      if (isDownloadEnabled) {
        downloadCollection(collection, trackIds)
      } else {
        removeCollectionDownload(collection, trackIds)
      }
    },
    [collection, trackIds]
  )

  if (!collection) return null
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
          disabled={isAnyDownloadInProgress}
        />
      </View>
    </View>
  )
}
