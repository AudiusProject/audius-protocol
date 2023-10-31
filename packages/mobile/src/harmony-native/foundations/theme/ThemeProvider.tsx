import type { ReactNode } from 'react'
import { createContext } from 'react'

import type { Theme } from '../types'

type ThemeContextType = {
  theme: Theme
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'day'
})

type ThemeProviderProps = {
  theme: Theme
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props
  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  )
}
