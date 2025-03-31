import { createModal } from '../createModal'

type ExternalWalletSignUpModalState = {}

const externalWalletSignUpModal = createModal<ExternalWalletSignUpModalState>({
  reducerPath: 'ExternalWalletSignUp',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useExternalWalletSignUpModal,
  actions: externalWalletSignUpModalActions,
  reducer: externalWalletSignUpModalReducer
} = externalWalletSignUpModal
