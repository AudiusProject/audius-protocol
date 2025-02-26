import { Nullable } from '@audius/common/utils'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type NotificationsUIState = {
  panelIsOpen: boolean
  modalNotificationId: Nullable<string>
  modalIsOpen: boolean
}

const initialState: NotificationsUIState = {
  panelIsOpen: false,
  modalNotificationId: null,
  modalIsOpen: false
}

type OpenNotificationModalAction = PayloadAction<{
  modalNotificationId: string
}>

const slice = createSlice({
  name: 'notifications-ui',
  initialState,
  reducers: {
    openNotificationPanel(state) {
      state.panelIsOpen = true
    },
    closeNotificationPanel(state) {
      state.panelIsOpen = false
    },
    openNotificationModal(state, action: OpenNotificationModalAction) {
      state.modalIsOpen = true
      state.modalNotificationId = action.payload.modalNotificationId
    },
    closeNotificationModal(state) {
      state.modalIsOpen = false
      state.modalNotificationId = null
    }
  }
})

export const {
  openNotificationPanel,
  closeNotificationPanel,
  openNotificationModal,
  closeNotificationModal
} = slice.actions

export default slice.reducer
