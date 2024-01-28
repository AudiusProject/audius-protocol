import {
  TrackDownload as TrackDownloadBase,
  type DownloadTrackArgs
} from '@audius/common'
import { downloadZip } from 'client-zip'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

function isMobileSafari() {
  if (!navigator) return false
  return (
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/)
  )
}

function browserDownload({
  url,
  filename
}: {
  url: string
  filename?: string
}) {
  if (document) {
    const link = document.createElement('a')
    link.href = url
    // taget=_blank does not work on ios safari and will cause the download to be
    // unresponsive.
    if (!isMobileSafari()) {
      link.target = '_blank'
    }
    link.click()
    console.log('REED filename for root', filename)
    link.download = filename ?? ''
    link.remove()
  } else {
    throw new Error('No document found')
  }
}
class TrackDownload extends TrackDownloadBase {
  async downloadTrack({ files, rootDirectoryName }: DownloadTrackArgs) {
    const responsePromises = files.map(
      async ({ url }) => await window.fetch(url)
    )
    const responses = await Promise.all(responsePromises)
    if (!responses.every((response) => response.ok)) {
      throw new Error('Download unsuccessful')
    }
    let url
    if (files.length === 1) {
      url = responses[0].url
    } else {
      if (!rootDirectoryName)
        throw new Error(
          'rootDirectory must be supplied when downloading multiple files'
        )
      const filenames = files.map(({ filename }) => filename)
      const blob = await downloadZip(
        responses.map((r, i) => {
          console.log('REED filenames[i]', filenames[i])
          return {
            name: rootDirectoryName + '/' + filenames[i],
            input: r
          }
        })
      ).blob()
      url = URL.createObjectURL(blob)
      console.log('REED url', url)
    }
    browserDownload({ url, filename: rootDirectoryName })
  }
}

export const trackDownload = new TrackDownload({
  audiusBackend: audiusBackendInstance
})
