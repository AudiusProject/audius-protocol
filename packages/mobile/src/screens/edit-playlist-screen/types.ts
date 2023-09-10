import type { Image, EditPlaylistValues } from '@audius/common'

export type UpdatedPlaylist = Omit<EditPlaylistValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
