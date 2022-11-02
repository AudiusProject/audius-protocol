import { useCallback } from 'react'

import type { Track } from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import {
  downloadTrack,
  purgeAllDownloads
} from 'app/services/offline-downloader'
import type { AppState } from 'app/store'
import { getOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { TrackDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'

import IconDownload from '../../assets/images/iconDownloadPurple.svg'
import IconNotDownloaded from '../../assets/images/iconNotDownloaded.svg'
import { Switch } from '../core/Switch'

type DownloadToggleProps = {
  collection: string
  tracks: Track[]
}

const useStyles = makeStyles(() => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

export const DownloadToggle = ({ tracks, collection }: DownloadToggleProps) => {
  const styles = useStyles()
  const isToggleOn = useSelector((state: AppState) => {
    const offlineDownloadStatus = getOfflineDownloadStatus(state)
    return tracks.some((track: Track) => {
      const status = offlineDownloadStatus[track.track_id.toString()]
      return (
        status === TrackDownloadStatus.LOADING ||
        status === TrackDownloadStatus.SUCCESS
      )
    })
  })

  const handleToggleDownload = useCallback(
    (isDownloadEnabled: boolean) => {
      if (isDownloadEnabled) {
        tracks.forEach((track) => {
          downloadTrack(track.track_id, collection)
        })
      } else {
        // TODO: remove only downloads associated with this collection
        purgeAllDownloads()
      }
    },
    [collection, tracks]
  )

  return (
    <View style={styles.root}>
      {isToggleOn ? <IconDownload /> : <IconNotDownloaded />}
      <Switch value={isToggleOn} onValueChange={handleToggleDownload} />
    </View>
  )
}
