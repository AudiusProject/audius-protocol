import { ID } from 'models/common/Identifiers'

export type DeletePlaylistConfirmationModalState = {
  isOpen: boolean
  playlistId: ID | null
}
