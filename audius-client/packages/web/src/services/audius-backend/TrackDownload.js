import { newTrackMetadata } from '@audius/common'

import { DownloadTrackMessage } from 'services/native-mobile-interface/downloadTrack'

import { waitForLibsInit } from './eagerLoadUtils'

const CHECK_DOWNLOAD_AVAILIBILITY_POLLING_INTERVAL = 3000

const updateTrackDownloadCIDInProgress = new Set([])

class TrackDownload {
  static async downloadTrack(cid, creatorNodeEndpoints, filename) {
    return window.audiusLibs.File.downloadCID(
      cid,
      creatorNodeEndpoints,
      filename
    )
  }

  static async downloadTrackMobile(cid, creatorNodeGateways, filename) {
    const urls = creatorNodeGateways.map(
      (gateway) => new URL(`${gateway}${cid}?filename=${filename}`)
    )

    const message = new DownloadTrackMessage({
      filename,
      urls
    })
    message.send()
  }

  /**
   * Updates the download cid for a track
   * @param {ID} trackId
   * @param {TrackMetadata} metadata
   * @param {string?} cid optional cid to update to, otherwise it is polled for
   */
  static async updateTrackDownloadCID(trackId, metadata, cid) {
    await waitForLibsInit()
    if (updateTrackDownloadCIDInProgress.has(trackId)) return
    if (metadata.download && metadata.download.cid) return

    updateTrackDownloadCIDInProgress.add(trackId)

    const cleanedMetadata = newTrackMetadata(metadata, true)
    const account = window.audiusLibs.Account.getCurrentUser()

    if (!cid) {
      cid = await TrackDownload.checkIfDownloadAvailable(
        trackId,
        account.creator_node_endpoint
      )
    }
    cleanedMetadata.download.cid = cid
    const update = await window.audiusLibs.Track.updateTrack(cleanedMetadata)

    updateTrackDownloadCIDInProgress.delete(trackId)
    return update
  }

  static async checkIfDownloadAvailable(trackId, creatorNodeEndpoints) {
    await waitForLibsInit()
    let cid
    while (!cid) {
      try {
        cid = await window.audiusLibs.Track.checkIfDownloadAvailable(
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

export default TrackDownload
