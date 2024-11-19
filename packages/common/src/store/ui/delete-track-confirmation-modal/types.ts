import { ID } from '../../../models/Identifiers'

export type DeleteTrackConfirmationModalState = {
  isOpen: boolean
  trackId: ID | null
}
