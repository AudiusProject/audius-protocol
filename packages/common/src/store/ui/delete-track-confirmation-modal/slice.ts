import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '~/utils/typeUtils'

import { ID } from '../../../models/Identifiers'

type DeleteTrackConfirmationState = {
  trackId: Nullable<ID>
}

export type OpenPayload = PayloadAction<{ trackId: ID }>

const initialState: DeleteTrackConfirmationState = {
  trackId: null
}

const slice = createSlice({
  name: 'applications/ui/deleteTrackConfirmation',
  initialState,
  reducers: {
    requestOpen: (_state, _action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      state.trackId = action.payload.trackId
    }
  }
})

export const { open, requestOpen } = slice.actions
export const actions = slice.actions
export default slice.reducer
