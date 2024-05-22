import { createContext } from 'react'

import { TextVariant } from './types'

export type TextContextValue = {
  variant?: TextVariant
}

export const TextContext = createContext<TextContextValue>({})
