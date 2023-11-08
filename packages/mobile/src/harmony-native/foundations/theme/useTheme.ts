import { useContext } from 'react'

import { ThemeContext } from './ThemeProvider'
import { dayTheme, darkTheme, matrixTheme } from './theme'

const themeConfig = {
  day: dayTheme,
  dark: darkTheme,
  matrix: matrixTheme
}

export const useTheme = () => {
  const { theme } = useContext(ThemeContext)
  return themeConfig[theme]
}
