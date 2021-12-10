import { Platform, Share } from 'react-native'
import RNFetchBlob, { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob'

import { dispatch } from 'app/App'
import { MessageType, MessageHandlers } from 'app/message/types'
import {
  setDownloadedPercentage,
  setFileInfo,
  setFetchCancel
} from 'app/store/download/slice'
import { setVisibility } from 'app/store/drawers/slice'

let fetchTask: StatefulPromise<FetchBlobResponse> = null

const cancelDownloadTask = () => {
  if (fetchTask) {
    fetchTask.cancel()
  }
}

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.DOWNLOAD_TRACK]: async ({ message }) => {
    const fileUrl = message.urls.find(url => url !== null && url !== undefined)
    const fileExtension = fileUrl.split('.').pop()
    const fileName = message.title + '.' + fileExtension

    dispatch(setVisibility({ drawer: 'DownloadTrackProgress', visible: true }))
    dispatch(setFileInfo({ trackName: message.title, fileName: fileName }))
    dispatch(setFetchCancel(cancelDownloadTask))

    if (Platform.OS === 'ios') {
      const filePath = RNFetchBlob.fs.dirs.DocumentDir + '/' + fileName
      // On iOS fetch & cache the track, let user choose where to download it
      // with the share sheet, then delete the cached copy of the track
      try {
        fetchTask = RNFetchBlob.config({
          fileCache: true,
          path: filePath
        }).fetch('GET', fileUrl)

        // Do this while download is occuring
        fetchTask.progress({ interval: 250 }, (received, total) => {
          dispatch(setDownloadedPercentage((received / total) * 100))
        })

        // Do this after download is done
        const fetchRes = await fetchTask
        dispatch(
          setVisibility({ drawer: 'DownloadTrackProgress', visible: false })
        )
        await Share.share({
          url: fetchRes.path()
        })
        fetchRes.flush()
      } catch (err) {
        console.error(err)
        await RNFetchBlob.fs.unlink(filePath) // On failure delete the file
      }
    } else {
      // On android save to FS and trigger notification that it is saved
      const filePath = RNFetchBlob.fs.dirs.DownloadDir + '/' + fileName
      try {
        const fetchTask = RNFetchBlob.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mediaScannable: true,
            title: message.title + 'download successful!',
            description: message.title,
            path: filePath,
            mime: 'audio/mpeg'
          }
        }).fetch('GET', fileUrl)

        // Do this while download is occuring
        // TODO: The RNFetchBlob library is currently broken for download progress events on Android.
        fetchTask.progress({ interval: 250 }, (received, total) => {
          dispatch(setDownloadedPercentage((received / total) * 100))
        })

        await fetchTask
        dispatch(
          setVisibility({ drawer: 'DownloadTrackProgress', visible: false })
        )
      } catch (err) {
        console.error(err)
        await RNFetchBlob.fs.unlink(filePath) // On failure delete the file
      }
    }
  }
}
