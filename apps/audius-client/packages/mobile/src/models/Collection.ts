import type { CID, CoverArtSizes, Nullable } from '@audius/common'

export type CollectionImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
  cover_art_cids: Nullable<CoverArtSizes>
}
