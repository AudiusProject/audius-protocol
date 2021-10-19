import { ID } from 'common/models/Identifiers'

export type UnfollowConfirmationModalState = {
  isOpen: boolean
  userId: ID | null
}
