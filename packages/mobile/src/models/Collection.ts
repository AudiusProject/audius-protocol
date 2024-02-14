import type { CID, CoverArtSizes } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'

export type CollectionImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
  cover_art_cids: Nullable<CoverArtSizes>
}
