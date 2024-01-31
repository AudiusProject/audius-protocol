import { TrackDownload as TrackDownloadBase } from '@audius/common/services'
import type { Nullable } from '@audius/common/utils'
import { Platform, Share } from 'react-native'
import type {
  FetchBlobResponse,
  RNFetchBlobConfig,
  StatefulPromise
} from 'rn-fetch-blob'
import RNFetchBlob from 'rn-fetch-blob'

import { dispatch } from 'app/store'
import {
  setDownloadedPercentage,
  setFileInfo,
  setFetchCancel
} from 'app/store/download/slice'
import { setVisibility } from 'app/store/drawers/slice'

import { audiusBackendInstance } from './audius-backend-instance'

let fetchTask: Nullable<StatefulPromise<FetchBlobResponse>> = null

const cancelDownloadTask = () => {
  if (fetchTask) {
    fetchTask.cancel()
  }
}

/**
 * Download a file via RNFetchBlob
 */
const download = async ({
  fileUrl,
  fileName,
  directory,
  getFetchConfig,
  onFetchComplete
}: {
  fileUrl: string
  fileName: string
  directory: string
  getFetchConfig: (filePath: string) => RNFetchBlobConfig
  onFetchComplete?: (response: FetchBlobResponse) => Promise<void>
}) => {
  const filePath = directory + '/' + fileName

  try {
    fetchTask = RNFetchBlob.config(getFetchConfig(filePath)).fetch(
      'GET',
      fileUrl
    )

    // Do this while download is occuring
    // TODO: The RNFetchBlob library is currently broken for download progress events on Android.
    fetchTask.progress({ interval: 250 }, (received, total) => {
      dispatch(setDownloadedPercentage((received / total) * 100))
    })

    const fetchRes = await fetchTask

    // Do this after download is done
    dispatch(setVisibility({ drawer: 'DownloadTrackProgress', visible: false }))

    await onFetchComplete?.(fetchRes)
  } catch (err) {
    console.error(err)

    // On failure attempt to delete the file
    try {
      const exists = await RNFetchBlob.fs.exists(filePath)
      if (!exists) return
      await RNFetchBlob.fs.unlink(filePath)
    } catch {}
  }
}

type DownloadTrackConfig = { url: string; filename: string }

const downloadTrack = async ({ url, filename }: DownloadTrackConfig) => {
  const fileUrl = url
  const fileName = filename
  const trackName = fileName.split('.').slice(0, -1).join('')

  dispatch(setVisibility({ drawer: 'DownloadTrackProgress', visible: true }))
  dispatch(setFileInfo({ trackName, fileName }))
  dispatch(setFetchCancel(cancelDownloadTask))

  if (Platform.OS === 'ios') {
    download({
      fileUrl,
      fileName,
      directory: RNFetchBlob.fs.dirs.DocumentDir,
      getFetchConfig: (filePath) => ({
        // On iOS fetch & cache the track, let user choose where to download it
        // with the share sheet, then delete the cached copy of the track.
        fileCache: true,
        path: filePath
      }),
      onFetchComplete: async (fetchRes) => {
        await Share.share({
          url: fetchRes.path()
        })
        fetchRes.flush()
      }
    })
  } else {
    download({
      fileUrl,
      fileName,
      directory: RNFetchBlob.fs.dirs.DownloadDir,
      getFetchConfig: (filePath) => ({
        // On android save to FS and trigger notification that it is saved
        addAndroidDownloads: {
          description: trackName,
          mediaScannable: true,
          mime: 'audio/mpeg',
          notification: true,
          path: filePath,
          title: trackName,
          useDownloadManager: true
        }
      })
    })
  }
}

class TrackDownload extends TrackDownloadBase {
  async downloadTrack({ url, filename }: { url: string; filename: string }) {
    await downloadTrack({ filename, url })
  }
}

export const trackDownload = new TrackDownload({
  audiusBackend: audiusBackendInstance
})
