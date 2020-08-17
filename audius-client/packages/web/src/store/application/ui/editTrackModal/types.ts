import { ID } from 'models/common/Identifiers'

export default interface EditTrackModalState {
  isOpen: boolean
  trackId: ID | null
}
