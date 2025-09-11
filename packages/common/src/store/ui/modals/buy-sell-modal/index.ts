import { createModal } from '../createModal'

export type BuySellModalState = {
  isOpen: boolean
  mint?: string
}

const BuySellModal = createModal<BuySellModalState>({
  reducerPath: 'BuySellModal',
  initialState: {
    isOpen: false,
    mint: undefined
  },
  sliceSelector: (state) => state.ui.modals
})

export const { hook: useBuySellModal, reducer: buySellModalReducer } =
  BuySellModal
