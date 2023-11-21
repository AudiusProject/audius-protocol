import { Action } from 'redux'

import { createModal } from '../createModal'

export type USDCManualTransferModalState = {
  source: 'add-funds' | 'purchase'
  amount?: number
  onSuccessAction?: Action
}

const USDCManualTransferModal = createModal<USDCManualTransferModalState>({
  reducerPath: 'USDCManualTransferModal',
  initialState: {
    isOpen: false,
    source: 'add-funds'
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useUSDCManualTransferModal,
  reducer: usdcManualTransferModalReducer
} = USDCManualTransferModal
