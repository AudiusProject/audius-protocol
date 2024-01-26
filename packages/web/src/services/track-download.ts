import { TrackDownload as TrackDownloadBase } from '@audius/common'
import { downloadZip } from 'client-zip'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

function isMobileSafari() {
  if (!navigator) return false
  return (
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/)
  )
}

class TrackDownload extends TrackDownloadBase {
  async downloadAll({
    files,
    zipFilename
  }: {
    files: { url: string; filename: string }[]
    zipFilename: string
  }) {
    const responsesAsync = files.map(async (f) => await window.fetch(f.url))
    const responses = await Promise.all(responsesAsync)
    if (!responses.every((response) => response.ok)) {
      throw new Error('Download unsuccessful')
    }

    if (document) {
      const link = document.createElement('a')
      const blob = await downloadZip(
        responses.map((r, i) => ({
          name: zipFilename + '/' + files[i].filename,
          input: r
        }))
      ).blob()
      link.href = URL.createObjectURL(blob)
      // taget=_blank does not work on ios safari and will cause the download to be
      // unresponsive.
      if (!isMobileSafari()) {
        link.target = '_blank'
      }
      link.download = zipFilename
      link.click()
      link.remove()
    } else {
      throw new Error('No document found')
    }
  }

  async downloadTrack({ url, filename }: { url: string; filename: string }) {
    const response = await window.fetch(url)
    if (!response.ok) {
      throw new Error('Download unsuccessful')
    }

    const downloadURL = (url: string, filename: string) => {
      if (document) {
        const link = document.createElement('a')
        link.href = url
        // taget=_blank does not work on ios safari and will cause the download to be
        // unresponsive.
        if (!isMobileSafari()) {
          link.target = '_blank'
        }
        link.download = filename
        link.click()
        link.remove()
      } else {
        throw new Error('No document found')
      }
    }
    downloadURL(response.url, filename)
  }
}

export const trackDownload = new TrackDownload({
  audiusBackend: audiusBackendInstance
})
