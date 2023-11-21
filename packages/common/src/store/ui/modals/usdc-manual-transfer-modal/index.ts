import { StartPurchaseContentFlowParams } from 'models/PurchaseContent'

import { createModal } from '../createModal'

export type USDCManualTransferModalState = {
  isOpen: boolean
  source: 'add-funds' | 'purchase'
  amount?: number
  startPurchaseParams?: StartPurchaseContentFlowParams
}

const USDCManualTransferModal = createModal<USDCManualTransferModalState>({
  reducerPath: 'USDCManualTransferModal',
  initialState: {
    isOpen: false,
    source: 'add-funds',
    amount: undefined,
    startPurchaseParams: undefined
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useUSDCManualTransferModal,
  reducer: usdcManualTransferModalReducer
} = USDCManualTransferModal
