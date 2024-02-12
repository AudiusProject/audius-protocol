import type { DownloadTrackArgs } from '@audius/common/services'
import { TrackDownload as TrackDownloadBase } from '@audius/common/services'
import { tracksSocialActions } from '@audius/common/store'
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
import { dedupFilenames } from '~/utils'

const { downloadFinished } = tracksSocialActions

let fetchTasks: StatefulPromise<FetchBlobResponse>[] = []

const audiusDownloadsDirectory = 'AudiusDownloads'

const cancelDownloadTask = () => {
  fetchTasks.forEach((task) => {
    task.cancel()
  })
}

/**
 * Download a file via RNFetchBlob
 */
const downloadOne = async ({
  fileUrl,
  filename,
  directory,
  getFetchConfig,
  onFetchComplete,
  flushOnComplete = false
}: {
  fileUrl: string
  filename: string
  directory: string
  getFetchConfig: (filePath: string) => RNFetchBlobConfig
  onFetchComplete?: (path: string) => Promise<void>
  /** Automatically remove cached download after onFetchComplete. Should be `true` if the cached response is not used directly (i.e. iOS share flow) */
  flushOnComplete?: boolean
}) => {
  const filePath = directory + '/' + filename

  try {
    const fetchTask = RNFetchBlob.config(getFetchConfig(filePath)).fetch(
      'GET',
      fileUrl
    )
    fetchTasks = [fetchTask]

    // TODO: The RNFetchBlob library is currently broken for download progress events on both platforms.
    // fetchTask.progress({ interval: 250 }, (received, total) => {
    //   dispatch(setDownloadedPercentage((received / total) * 100))
    // })

    const fetchRes = await fetchTask

    // Do this after download is done
    dispatch(setVisibility({ drawer: 'DownloadTrackProgress', visible: false }))

    await onFetchComplete?.(fetchRes.path())
    if (flushOnComplete) {
      fetchRes.flush()
    }
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
  dedupFilenames(files)
  try {
    const responsePromises = files.map(({ url, filename }) =>
      RNFetchBlob.config(getFetchConfig(directory + '/' + filename)).fetch(
        'GET',
        url
      )
    )
    fetchTasks = responsePromises
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

const download = async ({
  files,
  rootDirectoryName,
  abortSignal
}: DownloadTrackArgs) => {
  if (files.length === 0) return

  dispatch(
    setFileInfo({
      trackName: rootDirectoryName ?? '',
      fileName: files[0].filename
    })
  )
  if (abortSignal) {
    abortSignal.onabort = () => {
      cancelDownloadTask()
    }
  }
  // TODO: Remove this method of canceling after the lossless
  // feature set launches. The abort signal should be the way to do
  // this task cancellation going forward. The corresponding slice
  // may also be deleted.
  dispatch(setFetchCancel(cancelDownloadTask))

  const audiusDirectory =
    RNFetchBlob.fs.dirs.DocumentDir + '/' + audiusDownloadsDirectory

  if (Platform.OS === 'ios') {
    const onFetchComplete = async (path: string) => {
      dispatch(downloadFinished())
      await Share.share({
        url: path
      })
    }
    if (files.length === 1) {
      const { url, filename } = files[0]
      downloadOne({
        fileUrl: url,
        filename,
        directory: audiusDirectory,
        getFetchConfig: (filePath) => ({
          /* iOS single file download will stage a file into a temporary location, then use the
           * share sheet to let the user decide where to put it. Afterwards we delete the temp file.
           */
          fileCache: true,
          path: filePath
        }),
        flushOnComplete: true,
        onFetchComplete
      })
    } else {
      downloadMany({
        files,
        directory: audiusDirectory + '/' + rootDirectoryName,
        getFetchConfig: (filePath) => ({
          /* iOS multi-file download will download all files to a temp location and then create a ZIP and
           * let the user decide where to put it with the Share sheet. The temp files are deleted after the ZIP is created.
           */
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
        /* Single file download on Android will use the Download Manager and go
         * straight to the Downloads directory.
         */
        directory: RNFetchBlob.fs.dirs.DownloadDir,
        getFetchConfig: (filePath) => ({
          addAndroidDownloads: {
            description: filename,
            mediaScannable: true,
            mime: 'audio/mpeg',
            notification: true,
            path: filePath,
            title: filename,
            useDownloadManager: true
          }
        }),
        onFetchComplete: async () => {
          dispatch(downloadFinished())
        }
      })
    } else {
      if (!rootDirectoryName)
        throw new Error(
          'rootDirectory must be supplied when downloading multiple files'
        )
      downloadMany({
        files,
        /* Multi-file download on Android will stage the files in a temporary directory
         * under the downloads folder and then zip them. We don't use Download Manager for
         * the initial downloads to avoid showing notifications, then manually add a
         * notification for the zip file.
         */
        directory: RNFetchBlob.fs.dirs.DownloadDir + '/' + rootDirectoryName,
        getFetchConfig: (filePath) => ({
          fileCache: true,
          path: filePath
        }),
        onFetchComplete: async (path: string) => {
          RNFetchBlob.android.addCompleteDownload({
            title: rootDirectoryName,
            description: rootDirectoryName,
            mime: 'application/zip',
            path,
            showNotification: true
          })
          dispatch(downloadFinished())
        }
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
