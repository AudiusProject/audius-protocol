import { ID } from '../../../models/Identifiers'

export type DuplicateAddConfirmationModalState = {
  isOpen: boolean
  playlistId: ID | null
  trackId: ID | null
}
