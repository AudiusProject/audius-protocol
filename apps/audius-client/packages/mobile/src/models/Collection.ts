import type { CID } from '@audius/common'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'

export type CollectionImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
}
