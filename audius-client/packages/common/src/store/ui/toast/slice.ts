import { createSlice } from '@reduxjs/toolkit'

import {
  AddToastAction,
  DissmissToastAction,
  ToastAction,
  ToastState
} from './types'

const initialState: ToastState = {
  toasts: []
}

const slice = createSlice({
  name: 'application/ui/toast',
  initialState,
  reducers: {
    toast: (_, _action: ToastAction) => {},
    addToast: (state, action: AddToastAction) => {
      const toast = action.payload
      state.toasts.push(toast)
    },
    dismissToast: (state, action: DissmissToastAction) => {
      const { key } = action.payload
      const toasts = state.toasts.filter((toast) => toast.key !== key)
      state.toasts = toasts
    },
    clearToasts: (state) => {
      state.toasts = []
    }
  }
})

export const { toast, dismissToast, addToast, clearToasts } = slice.actions

export const actions = slice.actions
export default slice.reducer
