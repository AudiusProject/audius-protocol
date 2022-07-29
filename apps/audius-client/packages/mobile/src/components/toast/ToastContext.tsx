import type { ReactNode } from 'react'
import { createContext, memo, useCallback, useState } from 'react'

import type { ToastType } from './ToastView'
import ToastView from './ToastView'

const DEFAULT_TIMEOUT = 2000
export const SHARE_TOAST_TIMEOUT = 1500

type Toast = {
  content: ReactNode
  type: ToastType
  key: string
}

type ToastContextProps = {
  toast: (options: {
    content: ReactNode
    timeout?: number
    type?: ToastType
  }) => void
  clear: () => void
}

export const ToastContext = createContext<ToastContextProps>({
  clear: () => {},
  toast: () => {}
})

export const ToastContextProvider = memo((props: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({
      content,
      timeout = DEFAULT_TIMEOUT,
      type = 'info'
    }: {
      content: string | JSX.Element
      timeout: number
      type: ToastType
    }) => {
      const key = Math.random().toString()
      setToasts((toasts) => [...toasts, { content, key, type }])
      setTimeout(
        () => {
          setToasts((toasts) => toasts.slice(1))
        },
        // One second longer timeout to account for animation of toast leaving
        timeout + 1000
      )
    },
    [setToasts]
  )

  const clear = useCallback(() => setToasts([]), [setToasts])

  return (
    <ToastContext.Provider
      value={{
        clear,
        toast
      }}
    >
      {toasts.map((toast) => (
        <ToastView
          key={toast.key}
          content={toast.content}
          timeout={DEFAULT_TIMEOUT}
          type={toast.type}
        />
      ))}
      {props.children}
    </ToastContext.Provider>
  )
})
