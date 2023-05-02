import { createContext } from 'react'

interface ModalContextValue {
  titleId?: string
  subtitleId?: string
  onClose?: () => void
}

export const ModalContext = createContext<ModalContextValue>({})
