import { ID } from 'models/common/Identifiers'

export type UnfollowConfirmationModalState = {
  isOpen: boolean
  userId: ID | null
}
