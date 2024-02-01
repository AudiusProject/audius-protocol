import { USDCTransactionDetails } from '~/models/USDCTransactions'

import { createModal } from '../createModal'

export type USDCTransactionDetailsModalState = {
  transactionDetails?: USDCTransactionDetails
}

const USDCTransactionDetailsModal =
  createModal<USDCTransactionDetailsModalState>({
    reducerPath: 'USDCTransactionDetailsModal',
    initialState: {
      isOpen: false
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useUSDCTransactionDetailsModal,
  reducer: usdcTransactionDetailsModalReducer
} = USDCTransactionDetailsModal
