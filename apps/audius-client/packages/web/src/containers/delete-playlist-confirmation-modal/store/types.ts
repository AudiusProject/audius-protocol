import { ID } from 'common/models/Identifiers'

export type DeletePlaylistConfirmationModalState = {
  isOpen: boolean
  playlistId: ID | null
}
