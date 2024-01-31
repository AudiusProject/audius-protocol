import { Image, EditPlaylistValues  } from '@audius/common/store'
     import type {  } from '@audius/common'

export type UpdatedPlaylist = Omit<EditPlaylistValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
