import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppState } from 'store/types'

type Modals = 'TiersExplainer'

type InitialModalsState = { [modal in Modals]: boolean }

const initialState: InitialModalsState = {
  TiersExplainer: false
}

const slice = createSlice({
  name: 'application/ui/modals',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        modal: Modals
        visible: boolean
      }>
    ) => {
      const { modal, visible } = action.payload
      state[modal] = visible
    }
  }
})

export const getModalVisibility = (state: AppState, modal: Modals) =>
  state.application.ui.modals[modal]

export const { setVisibility } = slice.actions

export default slice.reducer
