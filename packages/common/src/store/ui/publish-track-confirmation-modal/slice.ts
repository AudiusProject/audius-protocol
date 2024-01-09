import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type OpenPayload = PayloadAction<{
    confirmCallback: () => void
}>

const initialState = {
    confirmCallback: () => { }
}

const slice = createSlice({
    name: 'applications/ui/publishTrackConfirmation',
    initialState,
    reducers: {
        requestOpen: (_state, _action: OpenPayload) => { },
        open: (state, action: OpenPayload) => {
            const { confirmCallback } = action.payload
            state.confirmCallback = confirmCallback
        }
    }
})

export const { open, requestOpen } = slice.actions
export const actions = slice.actions
export default slice.reducer
