import { decodeHashId } from '../../utils/hashId'
import { BaseAPI } from '../generated/default'
import type { createUploadTrackSchema } from './types'

export class TracksUploader extends BaseAPI {
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

  public transformTrackUploadMetadata(
    inputMetadata: z.output<
      ReturnType<typeof createUploadTrackSchema>
    >['metadata'],
    userId: number
  ) {
    const metadata = {
      ...inputMetadata,
      ownerId: userId
    }

    const isPremium = metadata.isPremium
    const isUnlisted = metadata.isUnlisted

    // If track is premium, set remixes to false
    if (isPremium && metadata.fieldVisibility) {
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
}
