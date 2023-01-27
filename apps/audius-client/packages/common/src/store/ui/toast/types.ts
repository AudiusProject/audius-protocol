import { PayloadAction } from '@reduxjs/toolkit'

type ToastContent = string | JSX.Element

export type ToastType = 'info' | 'error'

export type Toast = {
  content: ToastContent
  type?: ToastType
  key: string
  timeout?: number
}

export type ToastState = {
  toasts: Toast[]
}

export type ToastAction = PayloadAction<{
  content: ToastContent
  type?: ToastType
  timeout?: number
}>
export type AddToastAction = PayloadAction<Toast>
export type DissmissToastAction = PayloadAction<{ key: string }>
