import { Action } from '@reduxjs/toolkit'

import { createModal } from '../createModal'

export type CoinflowOnrampModalState = {
  /** Amount in dollars */
  amount: number
  memo?: string
  destinationWallet: string
  onrampSucceeded?: Action
  onrampCanceled?: Action
  onrampFailed?: Action
}

const premiumContentPurchaseModal = createModal<CoinflowOnrampModalState>({
  reducerPath: 'CoinflowOnramp',
  initialState: {
    isOpen: false,
    amount: -1,
    destinationWallet: ''
  },
  sliceSelector: (state) => state.ui.modals
  // enableTracking: true,
  // getTrackingData: ({ contentId }) => ({ contentId })
})

export const {
  hook: useCoinflowOnrampModal,
  reducer: coinflowOnrampModalReducer
} = premiumContentPurchaseModal
