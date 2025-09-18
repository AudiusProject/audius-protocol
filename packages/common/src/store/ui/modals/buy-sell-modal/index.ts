import { createModal } from '../createModal'

export type BuySellModalState = {
  isOpen: boolean
  ticker?: string
}

const BuySellModal = createModal<BuySellModalState>({
  reducerPath: 'BuySellModal',
  initialState: {
    isOpen: false,
    ticker: undefined
  },
  sliceSelector: (state) => state.ui.modals
})

export const { hook: useBuySellModal, reducer: buySellModalReducer } =
  BuySellModal
