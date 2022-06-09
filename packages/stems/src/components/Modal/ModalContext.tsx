import { createContext } from 'react'

interface ModalContextValue {
  titleId?: string
  subtitleId?: string
}

export const ModalContext = createContext<ModalContextValue>({})
