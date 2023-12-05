import type { UploadResponse } from '../../services/Storage/types'
import { decodeHashId } from '../../utils/hashId'
import { BaseAPI } from '../generated/default'
import type { PlaylistTrackMetadata } from '../playlists/types'

export class TrackUploadHelper extends BaseAPI {
  public async generateId(type: 'track' | 'playlist') {
    const response = await this.request({
      path: `/${type}s/unclaimed_id`,
      method: 'GET',
      headers: {},
      query: { noCache: Math.floor(Math.random() * 1000).toString() }
    })

    const { data } = await response.json()
    const id = decodeHashId(data)
    if (id === null) {
      throw new Error(`Could not generate ${type} id`)
    }
    return id
  }

  public transformTrackUploadMetadata<
    // TrackMetadata is a less strict type
    // only requiring the fields used in this function.
    // This supports both track/playlist uploads and edits
    TrackMetadata extends Pick<
      PlaylistTrackMetadata,
      'isPremium' | 'premiumConditions' | 'isUnlisted' | 'fieldVisibility'
    >
  >(inputMetadata: TrackMetadata, userId: number) {
    const metadata = {
      ...inputMetadata,
      ownerId: userId
    }

    const isPremium = metadata.isPremium
    const isUsdcGated = 'usdc_purchase' in (metadata.premiumConditions ?? {})
    const isUnlisted = metadata.isUnlisted

    // If track is premium and not usdc purchase gated, set remixes to false
    if (isPremium && !isUsdcGated && metadata.fieldVisibility) {
      metadata.fieldVisibility.remixes = false
    }

    // If track is public, set required visibility fields to true
    if (!isUnlisted) {
      metadata.fieldVisibility = {
        ...metadata.fieldVisibility,
        genre: true,
        mood: true,
        tags: true,
        share: true,
        playCount: true
      }
    }
    return metadata
  }

  public populateTrackMetadataWithUploadResponse(
    trackMetadata: PlaylistTrackMetadata,
    audioResponse: UploadResponse,
    coverArtResponse: UploadResponse
  ) {
    return {
      ...trackMetadata,
      trackSegments: [],
      trackCid: audioResponse.results['320'],
      previewCid: trackMetadata.previewStartSeconds
        ? audioResponse.results[
        `320_preview|${trackMetadata.previewStartSeconds}`
        ]
        : trackMetadata.previewCid,
      origFileCid: trackMetadata.origFileCid,
      origFilename: trackMetadata.origFilename,
      audioUploadId: audioResponse.id,
      download: trackMetadata.download?.isDownloadable
        ? {
          ...trackMetadata.download,
          cid: audioResponse.results['320']
        }
        : trackMetadata.download,
      coverArtSizes: coverArtResponse.id,
      duration: parseInt(audioResponse.probe.format.duration, 10)
    }
  }
}
