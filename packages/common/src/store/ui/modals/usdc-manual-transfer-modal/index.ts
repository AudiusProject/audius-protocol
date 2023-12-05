import { createModal } from '../createModal'

export type USDCManualTransferModalState = {}

const USDCManualTransferModal = createModal<USDCManualTransferModalState>({
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
