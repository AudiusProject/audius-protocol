import { PayloadAction } from '@reduxjs/toolkit'

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
