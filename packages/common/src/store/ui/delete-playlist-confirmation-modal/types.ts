import { ID } from '../../../models/Identifiers'

export type DeletePlaylistConfirmationModalState = {
  isOpen: boolean
  playlistId: ID | null
}
