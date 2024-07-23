import type { Image, EditCollectionValues } from '@audius/common/store'

export type UpdatedPlaylist = Omit<EditCollectionValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
