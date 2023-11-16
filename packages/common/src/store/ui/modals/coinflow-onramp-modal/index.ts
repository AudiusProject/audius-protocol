import { Action } from '@reduxjs/toolkit'

import { createModal } from '../createModal'

export type CoinflowOnrampModalState = {
  amount: number
  serializedTransaction: string
  onrampSucceeded?: Action
  onrampCanceled?: Action
  onrampFailed?: Action
}

const premiumContentPurchaseModal = createModal<CoinflowOnrampModalState>({
  reducerPath: 'CoinflowOnramp',
  initialState: {
    isOpen: false,
    amount: -1,
    serializedTransaction: ''
  },
  sliceSelector: (state) => state.ui.modals
  // enableTracking: true,
  // getTrackingData: ({ contentId }) => ({ contentId })
})

export const {
  hook: useCoinflowOnrampModal,
  actions: coinflowOnrampModalActions,
  reducer: coinflowOnrampModalReducer
} = premiumContentPurchaseModal
