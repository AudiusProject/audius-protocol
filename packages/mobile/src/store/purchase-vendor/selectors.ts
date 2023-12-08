import type { AppState } from 'app/store'

export const getPurchaseVendor = (state: AppState) => state.purchaseVendor.card
