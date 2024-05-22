import { ReactNode } from 'react'

import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

type ServerThemeProviderProps = {
  children: ReactNode
}

export const ServerThemeProvider = (props: ServerThemeProviderProps) => {
  const { children } = props

  return <HarmonyThemeProvider theme={'day'}>{children}</HarmonyThemeProvider>
}
