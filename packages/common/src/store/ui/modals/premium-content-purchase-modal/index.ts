import { ID } from 'models/Identifiers'

import { createModal } from '../createModal'

export type PremiumContentPurchaseModalState = {
  contentId: ID
}

const premiumContentPurchaseModal =
  createModal<PremiumContentPurchaseModalState>({
    reducerPath: 'PremiumContentPurchaseModal',
    initialState: {
      isOpen: false,
      contentId: -1
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: usePremiumContentPurchaseModal,
  reducer: premiumContentPurchaseModalReducer
} = premiumContentPurchaseModal
