import { USDCPurchaseDetails } from 'models/USDCTransactions'

import { createModal } from '../createModal'

export enum USDCPurchaseDetailsModalPages {
  ENTER_TRANSFER_DETAILS = 'enter_transfer_details',
  CONFIRM_TRANSFER_DETAILS = 'confirm_transfer_details',
  TRANSFER_IN_PROGRESS = 'transfer_in_progress',
  TRANSFER_SUCCESSFUL = 'transfer_successful'
}

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
