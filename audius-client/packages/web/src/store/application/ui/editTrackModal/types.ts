import { ID } from 'common/models/Identifiers'

export default interface EditTrackModalState {
  isOpen: boolean
  trackId: ID | null
}
