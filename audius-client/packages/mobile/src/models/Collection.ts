import { CID } from 'audius-client/src/common/models/Identifiers'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'

export type CollectionImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
}
