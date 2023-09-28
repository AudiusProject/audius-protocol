import { createContext } from 'react'

interface ModalContextValue {
  titleId?: string
  subtitleId?: string
  isDoneOpening?: boolean
  onClose?: () => void
}

export const ModalContext = createContext<ModalContextValue>({})
