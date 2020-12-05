import { createSlice } from '@reduxjs/toolkit'

type EnablePushNotificationsDrawerState = {
  isOpen: boolean
}

const initialState: EnablePushNotificationsDrawerState = {
  isOpen: false
}

const slice = createSlice({
  name: 'enable-push-notifications-drawer',
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
