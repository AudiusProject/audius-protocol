import { TrackDownload as TrackDownloadBase } from '@audius/common'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

class TrackDownload extends TrackDownloadBase {
  async downloadTrack({ url, filename }: { url: string; filename: string }) {
    const response = await window.fetch(url)
    if (!response.ok) {
      throw new Error('Download unsuccessful')
    }

    const downloadURL = (url: string, filename: string) => {
      if (document) {
        const link = document.createElement('a')
        link.href = url
        link.target = '_blank'
        link.download = filename
        link.click()
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
