import { Nullable } from '~/utils/typeUtils'

import { createModal } from '../createModal'

export type EditAccessType = 'audience' | 'release' | 'early_release' | 'hidden'

export type EditAccessConfirmationModalState = {
  type: Nullable<EditAccessType>
  confirmCallback: () => void
  cancelCallback?: () => void
}

const editAccessConfirmationModal =
  createModal<EditAccessConfirmationModalState>({
    reducerPath: 'EditAccessConfirmation',
    initialState: {
      isOpen: false,
      type: null,
      confirmCallback: () => {},
      cancelCallback: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useEditAccessConfirmationModal,
  actions: editAccessConfirmationModalActions,
  reducer: editAccessConfirmationModalReducer
} = editAccessConfirmationModal
