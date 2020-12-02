import { createSlice } from '@reduxjs/toolkit'

type MobileUploadDrawerState = {
  isOpen: boolean
}

const initialState: MobileUploadDrawerState = {
  isOpen: false
}

const slice = createSlice({
  name: 'mobile-upload-drawer',
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
