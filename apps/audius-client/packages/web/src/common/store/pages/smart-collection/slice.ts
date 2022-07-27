import { SmartCollection, SmartCollectionVariant } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type FetchPayload = {
  variant: SmartCollectionVariant
}

type FetchSucceededPayload = {
  variant: SmartCollectionVariant
  collection: SmartCollection
}

export type SmartCollectionState = {
  [key in SmartCollectionVariant]?: SmartCollection
}

// Smart variants are dynamically added
const initialState: SmartCollectionState = {}

const slice = createSlice({
  name: 'application/pages/smartCollectionPage',
  initialState,
  reducers: {
    fetchSmartCollection: (state, action: PayloadAction<FetchPayload>) => {},
    fetchSmartCollectionSucceeded: (
      state,
      action: PayloadAction<FetchSucceededPayload>
    ) => {
      const { variant, collection } = action.payload
      state[variant] = collection
    }
  }
})

export const { fetchSmartCollection, fetchSmartCollectionSucceeded } =
  slice.actions

export default slice.reducer
