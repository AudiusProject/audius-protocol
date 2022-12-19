import type {
  Collection,
  CoverArtSizes,
  Track,
  UserMetadata
} from '@audius/common'
import { DefaultSizes, SquareSizes } from '@audius/common'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'

type EntityWithArt = Pick<
  Track | Collection,
  'cover_art_sizes' | 'cover_art'
> & {
  user: UserMetadata
}

export const populateCoverArtSizes = async <T extends EntityWithArt>(
  entity: T
): Promise<T & { _cover_art_sizes: CoverArtSizes }> => {
  const newEntity = { ...entity, _cover_art_sizes: {} }
  if (!entity || !entity.user || (!entity.cover_art_sizes && !entity.cover_art))
    return newEntity
  const gateways = audiusBackendInstance.getCreatorNodeIPFSGateways(
    entity.user.creator_node_endpoint
  )
  const multihash = entity.cover_art_sizes || entity.cover_art
  if (!multihash) return newEntity
  await Promise.allSettled(
    Object.values(SquareSizes).map(async (size) => {
      const coverArtSize = multihash === entity.cover_art_sizes ? size : null
      const url = await audiusBackendInstance.getImageUrl(
        multihash,
        coverArtSize,
        gateways
      )
      newEntity._cover_art_sizes = {
        ...newEntity._cover_art_sizes,
        [coverArtSize || DefaultSizes.OVERRIDE]: url
      }
    })
  )
  return newEntity
}
