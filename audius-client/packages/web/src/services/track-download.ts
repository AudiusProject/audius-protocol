import { CID, TrackDownload as TrackDownloadBase } from '@audius/common'

import { audiusBackendInstance } from './audius-backend/audius-backend-instance'

class TrackDownload extends TrackDownloadBase {
  async downloadTrack(
    cid: CID,
    creatorNodeEndpoints: string[],
    filename: string
  ) {
    const audiusLibs = await this.audiusBackend.getAudiusLibs()
    return audiusLibs.File.downloadCID(cid, creatorNodeEndpoints, filename)
  }
}

export const trackDownload = new TrackDownload({
  audiusBackend: audiusBackendInstance
})
