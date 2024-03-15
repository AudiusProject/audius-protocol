import { ID } from '~/models/Identifiers'
import { PurchaseableContentType } from '~/store/purchase-content'

import { createModal } from '../createModal'

export type PremiumContentPurchaseModalState = {
  contentId: ID
  contentType: PurchaseableContentType
}

const premiumContentPurchaseModal =
  createModal<PremiumContentPurchaseModalState>({
    reducerPath: 'PremiumContentPurchaseModal',
    initialState: {
      isOpen: false,
      contentId: -1,
      contentType: PurchaseableContentType.TRACK
    },
    sliceSelector: (state) => state.ui.modals,
    enableTracking: true,
    getTrackingData: ({ contentId, contentType }) => ({
      contentId,
      contentType
    })
  })

export const {
  hook: usePremiumContentPurchaseModal,
  reducer: premiumContentPurchaseModalReducer
} = premiumContentPurchaseModal
