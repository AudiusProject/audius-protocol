import { Action } from '@reduxjs/toolkit'

import { ID } from 'models/Identifiers'

import { createModal } from '../createModal'

export type CoinflowOnrampModalState = {
  amount: number
  contentId?: ID
  serializedTransaction: string
  onrampSucceeded?: Action
  onrampCanceled?: Action
  onrampFailed?: Action
}

const coinflowOnrampModal = createModal<CoinflowOnrampModalState>({
  reducerPath: 'CoinflowOnramp',
  initialState: {
    contentId: undefined,
    isOpen: false,
    amount: -1,
    serializedTransaction: ''
  },
  sliceSelector: (state) => state.ui.modals,
  enableTracking: true,
  getTrackingData: ({ contentId }) => ({ contentId })
})

export const {
  hook: useCoinflowOnrampModal,
  actions: coinflowOnrampModalActions,
  reducer: coinflowOnrampModalReducer
} = coinflowOnrampModal
