import { createContext } from 'react'

type ToastContextProps = {
  toast: (content: string | JSX.Element, timeout?: number) => void
  clear: () => void
}

export const ToastContext = createContext<ToastContextProps>({
  clear: () => {},
  toast: () => {}
})
