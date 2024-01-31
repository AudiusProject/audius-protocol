import type { Image, EditPlaylistValues } from '@audius/common/store'

export type UpdatedPlaylist = Omit<EditPlaylistValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
