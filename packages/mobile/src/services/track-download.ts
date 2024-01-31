import {
  TrackDownload as TrackDownloadBase,
  tracksSocialActions
} from '@audius/common'
import type { DownloadTrackArgs, Nullable } from '@audius/common'
import { Platform, Share } from 'react-native'
import { zip } from 'react-native-zip-archive'
import type {
  FetchBlobResponse,
  RNFetchBlobConfig,
  StatefulPromise
} from 'rn-fetch-blob'
import RNFetchBlob from 'rn-fetch-blob'

import { dispatch } from 'app/store'
import { setFetchCancel, setFileInfo } from 'app/store/download/slice'
import { setVisibility } from 'app/store/drawers/slice'

import { audiusBackendInstance } from './audius-backend-instance'

const { downloadFinished } = tracksSocialActions

let fetchTask: Nullable<StatefulPromise<FetchBlobResponse>> = null

const audiusDownloadsDirectory = 'AudiusDownloads'

const cancelDownloadTask = () => {
  if (fetchTask) {
    fetchTask.cancel()
  }
}

/**
 * Download a file via RNFetchBlob
 */
const downloadOne = async ({
  fileUrl,
  filename,
  directory,
  getFetchConfig,
  onFetchComplete
}: {
  fileUrl: string
  filename: string
  directory: string
  getFetchConfig: (filePath: string) => RNFetchBlobConfig
  onFetchComplete?: (path: string) => Promise<void>
}) => {
  const filePath = directory + '/' + filename

  try {
    fetchTask = RNFetchBlob.config(getFetchConfig(filePath)).fetch(
      'GET',
      fileUrl
    )

    // TODO: The RNFetchBlob library is currently broken for download progress events on both platforms.
    // fetchTask.progress({ interval: 250 }, (received, total) => {
    //   dispatch(setDownloadedPercentage((received / total) * 100))
    // })

    const fetchRes = await fetchTask

    // Do this after download is done
    dispatch(setVisibility({ drawer: 'DownloadTrackProgress', visible: false }))

    await onFetchComplete?.(fetchRes.path())
    fetchRes.flush()
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

/**
 * Download multiple files via RNFetchBlob
 */
const downloadMany = async ({
  files,
  directory,
  getFetchConfig,
  onFetchComplete
}: {
  files: { url: string; filename: string }[]
  directory: string
  getFetchConfig: (filePath: string) => RNFetchBlobConfig
  onFetchComplete?: (path: string) => Promise<void>
}) => {
  try {
    const responsePromises = files.map(async ({ url, filename }) =>
      RNFetchBlob.config(getFetchConfig(directory + '/' + filename)).fetch(
        'GET',
        url
      )
    )
    const responses = await Promise.all(responsePromises)
    if (!responses.every((response) => response.info().status === 200)) {
      throw new Error('Download unsuccessful')
    }

    await zip(directory, directory + '.zip')
    await onFetchComplete?.(directory + '.zip')
    responses.forEach((response) => response.flush())
  } catch (err) {
    console.error(err)

    // On failure attempt to delete the files
    try {
      const exists = await RNFetchBlob.fs.exists(directory)
      if (!exists) return
      await RNFetchBlob.fs.unlink(directory)
    } catch {}
  }
}

const download = async ({ files, rootDirectoryName }: DownloadTrackArgs) => {
  if (files.length === 0) return

  dispatch(
    setFileInfo({
      trackName: rootDirectoryName ?? '',
      fileName: files[0].filename
    })
  )
  dispatch(setFetchCancel(cancelDownloadTask))

  const audiusDirectory =
    RNFetchBlob.fs.dirs.DocumentDir + '/' + audiusDownloadsDirectory
  const onFetchComplete = async (path: string) => {
    dispatch(downloadFinished())
    await Share.share({
      url: path
    })
  }

  if (Platform.OS === 'ios') {
    if (files.length === 1) {
      const { url, filename } = files[0]
      downloadOne({
        fileUrl: url,
        filename,
        directory: audiusDirectory,
        getFetchConfig: (filePath) => ({
          // On iOS fetch & cache the track, let user choose where to download it
          // with the share sheet, then delete the cached copy of the track.
          fileCache: true,
          path: filePath
        }),
        onFetchComplete
      })
    } else {
      downloadMany({
        files,
        directory: audiusDirectory + '/' + rootDirectoryName,
        getFetchConfig: (filePath) => ({
          // On iOS fetch & cache the track, let user choose where to download it
          // with the share sheet, then delete the cached copy of the track.
          fileCache: true,
          path: filePath
        }),
        onFetchComplete
      })
    }
  } else {
    if (files.length === 1) {
      const { url, filename } = files[0]
      downloadOne({
        fileUrl: url,
        filename,
        directory: RNFetchBlob.fs.dirs.DownloadDir,
        getFetchConfig: (filePath) => ({
          // On android save to FS and trigger notification that it is saved
          addAndroidDownloads: {
            description: filename,
            mediaScannable: true,
            mime: 'audio/mpeg',
            notification: true,
            path: filePath,
            title: filename,
            useDownloadManager: true
          }
        })
      })
    } else {
      downloadMany({
        files,
        directory: RNFetchBlob.fs.dirs.DownloadDir,
        getFetchConfig: (filePath) => ({
          // On android save to FS and trigger notification that it is saved
          addAndroidDownloads: {
            description: rootDirectoryName,
            mediaScannable: true,
            mime: 'audio/mpeg',
            notification: true,
            path: filePath,
            title: rootDirectoryName,
            useDownloadManager: true
          }
        })
      })
    }
  }
}

class TrackDownload extends TrackDownloadBase {
  async downloadTracks(args: DownloadTrackArgs) {
    await download(args)
  }
}

export const trackDownload = new TrackDownload({
  audiusBackend: audiusBackendInstance
})
