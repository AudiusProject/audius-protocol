import { createModal } from '../createModal'

export type CoinflowWithdrawModalState = {
  amount: number
}

const coinflowWithdrawModal = createModal<CoinflowWithdrawModalState>({
  reducerPath: 'CoinflowWithdraw',
  initialState: {
    isOpen: false,
    amount: 5
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useCoinflowWithdrawModal,
  actions: coinflowWithdrawModalActions,
  reducer: coinflowWithdrawModalReducer
} = coinflowWithdrawModal
