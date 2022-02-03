import { createContext, memo, ReactNode, useState } from 'react'

import { useDarkMode } from 'react-native-dark-mode'

import { Theme } from 'app/utils/theme'

type ThemeContextProps = {
  setTheme: (theme: Theme) => void
  getTheme: () => Theme
  isSystemDarkMode: boolean
}

export const ThemeContext = createContext<ThemeContextProps>({
  setTheme: () => {},
  getTheme: () => Theme.DEFAULT,
  isSystemDarkMode: false
})

export const ThemeContextProvider = memo((props: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(Theme.DEFAULT)
  const isSystemDarkMode = useDarkMode()
  return (
    <ThemeContext.Provider
      value={{
        setTheme,
        getTheme: () => theme,
        isSystemDarkMode
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  )
})
