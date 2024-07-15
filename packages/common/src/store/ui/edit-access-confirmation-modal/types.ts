import { Nullable } from '~/utils'

export type EditAccessType = 'audience' | 'release' | 'early_release' | 'hidden'

export type EditAccessConfirmationState = {
  type: Nullable<EditAccessType>
  confirmCallback: () => void
  cancelCallback: () => void
}

export type EditAccessConfirmationModalState = {
  isOpen: boolean
} & EditAccessConfirmationState
