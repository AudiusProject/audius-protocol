import { AudiusBackend } from 'services/audius-backend'

import { CID, ID, TrackMetadata } from '../../models'
import { newTrackMetadata } from '../../schemas'

const CHECK_DOWNLOAD_AVAILIBILITY_POLLING_INTERVAL = 3000

const updateTrackDownloadCIDInProgress = new Set<number>([])

export type TrackDownloadConfig = {
  audiusBackend: AudiusBackend
}

export class TrackDownload {
  audiusBackend: AudiusBackend

  constructor(config: TrackDownloadConfig) {
    this.audiusBackend = config.audiusBackend
  }

  async downloadTrack(
    _cid: CID,
    _creatorNodeEndpoints: string[],
    _filename: string
  ) {
    throw new Error('downloadTrack not implemented')
  }

  /**
   * Updates the download cid for a track
   */
  async updateTrackDownloadCID(
    trackId: ID,
    metadata: TrackMetadata,
    // optional cid to update to, otherwise it is polled for
    cid: CID
  ) {
    const audiusLibs = await this.audiusBackend.getAudiusLibs()
    if (updateTrackDownloadCIDInProgress.has(trackId)) return
    if (metadata.download && metadata.download.cid) return

    updateTrackDownloadCIDInProgress.add(trackId)

    const cleanedMetadata = newTrackMetadata(metadata, true)
    const account = audiusLibs.Account.getCurrentUser()

    if (!cid) {
      cid = await this.checkIfDownloadAvailable(
        trackId,
        account.creator_node_endpoint
      )
    }
    cleanedMetadata.download.cid = cid
    const update = await audiusLibs.Track.updateTrack(cleanedMetadata)

    updateTrackDownloadCIDInProgress.delete(trackId)
    return update
  }

  async checkIfDownloadAvailable(trackId: ID, creatorNodeEndpoints: string[]) {
    const audiusLibs = await this.audiusBackend.getAudiusLibs()
    let cid
    while (!cid) {
      try {
        cid = await audiusLibs.Track.checkIfDownloadAvailable(
          creatorNodeEndpoints,
          trackId
        )
      } catch (e) {
        console.error(e)
        return null
      }
      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_DOWNLOAD_AVAILIBILITY_POLLING_INTERVAL)
      )
    }
    return cid
  }
}
