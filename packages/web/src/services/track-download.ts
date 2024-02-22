import { Name } from '@audius/common/models'
import {
  DownloadFile,
  TrackDownload as TrackDownloadBase,
  type DownloadTrackArgs
} from '@audius/common/services'
import { tracksSocialActions, downloadsActions } from '@audius/common/store'
import { dedupFilenames } from '@audius/common/utils'
import { downloadZip } from 'client-zip'

import { track as trackEvent } from './analytics/amplitude'
import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

const { downloadFinished } = tracksSocialActions

const { beginDownload, setDownloadError } = downloadsActions

function isMobileSafari() {
  if (!navigator) return false
  return (
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/)
  )
}

function browserDownload({ url, filename }: DownloadFile) {
  if (document) {
    const link = document.createElement('a')
    link.href = url
    // taget=_blank does not work on ios safari and will cause the download to be
    // unresponsive.
    if (!isMobileSafari()) {
      link.target = '_blank'
    }
    link.download = filename ?? ''
    link.click()
    link.remove()
  } else {
    throw new Error('No document found')
  }
}

class TrackDownload extends TrackDownloadBase {
  async downloadTracks({
    files,
    rootDirectoryName,
    abortSignal
  }: DownloadTrackArgs) {
    if (files.length === 0) return

    const dispatch = window.store.dispatch

    dispatch(beginDownload())

    dedupFilenames(files)
    const responsePromises = files.map(
      async ({ url }) => await window.fetch(url, { signal: abortSignal })
    )
    try {
      const responses = await Promise.all(responsePromises)
      if (!responses.every((response) => response.ok)) {
        throw new Error('Download unsuccessful')
      }
      const filename = rootDirectoryName ?? files[0].filename
      let url
      if (files.length === 1) {
        url = responses[0].url
      } else {
        if (!rootDirectoryName)
          throw new Error(
            'rootDirectory must be supplied when downloading multiple files'
          )
        const blob = await downloadZip(
          responses.map((r, i) => {
            return {
              name: rootDirectoryName + '/' + files[i].filename,
              input: r
            }
          })
        ).blob()
        url = URL.createObjectURL(blob)
      }
      browserDownload({ url, filename })
      dispatch(downloadFinished())

      // Track download success event
      const eventName =
        files.length === 1
          ? Name.TRACK_DOWNLOAD_SUCCESSFUL_DOWNLOAD_SINGLE
          : Name.TRACK_DOWNLOAD_SUCCESSFUL_DOWNLOAD_ALL
      trackEvent(eventName, { device: 'web' })
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        console.info('Download aborted by the user')
      } else {
        dispatch(
          setDownloadError(
            e instanceof Error ? e : new Error(`Download failed: ${e}`)
          )
        )

        // Track download failure event
        const eventName =
          files.length === 1
            ? Name.TRACK_DOWNLOAD_FAILED_DOWNLOAD_SINGLE
            : Name.TRACK_DOWNLOAD_FAILED_DOWNLOAD_ALL
        trackEvent(eventName, { device: 'web' })

        throw e
      }
    }
  }
}

export const trackDownload = new TrackDownload({
  audiusBackend: audiusBackendInstance
})
