import React, { createContext, memo, ReactNode, useState } from 'react'

import { Theme } from 'app/utils/theme'

type ThemeContextProps = {
  setTheme: (theme: Theme) => void
  getTheme: () => Theme
}

export const ThemeContext = createContext<ThemeContextProps>({
  setTheme: () => {},
  getTheme: () => Theme.DEFAULT
})

export const ThemeContextProvider = memo((props: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(Theme.DEFAULT)
  return (
    <ThemeContext.Provider
      value={{
        setTheme,
        getTheme: () => theme
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  )
})
