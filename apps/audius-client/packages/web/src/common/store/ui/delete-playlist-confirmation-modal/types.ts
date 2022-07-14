import { ID } from '@audius/common'

export type DeletePlaylistConfirmationModalState = {
  isOpen: boolean
  playlistId: ID | null
}
