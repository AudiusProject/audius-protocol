import { ReactNode } from 'react'

import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const harmonyTheme = 'day'

  return (
    <HarmonyThemeProvider theme={harmonyTheme}>{children}</HarmonyThemeProvider>
  )
}
