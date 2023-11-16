import { createModal } from '../createModal'

export type AddFundsModalState = {
  isOpen: boolean
}

const AddFundsModal = createModal<AddFundsModalState>({
  reducerPath: 'AddFundsModal',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const { hook: useAddFundsModal, reducer: addFundsModalReducer } =
  AddFundsModal
