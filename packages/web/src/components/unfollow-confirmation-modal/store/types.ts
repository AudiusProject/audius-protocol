import { ID } from '@audius/common/models'

export type UnfollowConfirmationModalState = {
  isOpen: boolean
  userId: ID | null
}
