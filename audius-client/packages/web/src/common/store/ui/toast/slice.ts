import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type ToastContent = string | JSX.Element

type Toast = {
  content: ToastContent
  key: string
}

export type ToastState = {
  toasts: Toast[]
}

export type ToastAction = PayloadAction<{
  content: ToastContent
  timeout?: number
}>
export type AddToastAction = PayloadAction<Toast>
export type DissmissToastAction = PayloadAction<{ key: string }>

const initialState: ToastState = {
  toasts: []
}

const slice = createSlice({
  name: 'application/ui/toast',
  initialState,
  reducers: {
    toast: (_, action: ToastAction) => {},
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

export default slice.reducer
