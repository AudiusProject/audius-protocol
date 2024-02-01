import type { PurchaseVendor } from '@audius/common/models'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type PurchaseVendorState = {
  card?: PurchaseVendor
}

const initialState: PurchaseVendorState = {
  card: undefined
}

const slice = createSlice({
  name: 'purchaseVendor',
  initialState,
  reducers: {
    setPurchaseVendor: (state, action: PayloadAction<PurchaseVendor>) => {
      state.card = action.payload
    },
    reset: () => initialState
  }
})

export const { setPurchaseVendor, reset } = slice.actions

export default slice.reducer
