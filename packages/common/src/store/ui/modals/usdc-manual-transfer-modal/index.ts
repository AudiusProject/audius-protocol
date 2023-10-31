import { createModal } from '../createModal'

const USDCManualTransferModal = createModal({
  reducerPath: 'USDCManualTransferModal',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useUSDCManualTransferModal,
  reducer: usdcManualTransferModalReducer
} = USDCManualTransferModal
