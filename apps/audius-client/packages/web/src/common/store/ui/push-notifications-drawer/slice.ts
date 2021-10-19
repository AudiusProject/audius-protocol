import { createSlice } from '@reduxjs/toolkit'

export type PushNotificationsDrawerState = {
  isOpen: boolean
}

const initialState: PushNotificationsDrawerState = {
  isOpen: false
}

const slice = createSlice({
  name: 'ui/enable-push-notifications-drawer',
  initialState,
  reducers: {
    show: state => {
      state.isOpen = true
    },
    hide: state => {
      state.isOpen = false
    }
  }
})

export const { show, hide } = slice.actions

export default slice.reducer
