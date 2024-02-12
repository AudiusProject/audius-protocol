import { USDCPurchaseDetails } from '~/models/USDCTransactions'

import { createModal } from '../createModal'

export type USDCPurchaseDetailsModalState = {
  variant: 'purchase' | 'sale'
  purchaseDetails?: USDCPurchaseDetails
}

const USDCPurchaseDetailsModal = createModal<USDCPurchaseDetailsModalState>({
  reducerPath: 'USDCPurchaseDetailsModal',
  initialState: {
    isOpen: false,
    variant: 'purchase'
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useUSDCPurchaseDetailsModal,
  reducer: usdcPurchaseDetailsModalReducer
} = USDCPurchaseDetailsModal
