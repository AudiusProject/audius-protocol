import { Nullable } from '~/utils'

export type EditAccessType = 'visibility' | 'audience'

export type EditAccessConfirmationState = {
  type: Nullable<EditAccessType>
  confirmCallback: () => void
  cancelCallback: () => void
}

export type EditAccessConfirmationModalState = {
  isOpen: boolean
} & EditAccessConfirmationState
