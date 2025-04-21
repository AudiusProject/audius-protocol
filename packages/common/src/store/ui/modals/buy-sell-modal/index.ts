import { createModal } from '../createModal'

export type BuySellModalState = {
  isOpen: boolean
}

const BuySellModal = createModal<BuySellModalState>({
  reducerPath: 'BuySellModal',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const { hook: useBuySellModal, reducer: buySellModalReducer } =
  BuySellModal
