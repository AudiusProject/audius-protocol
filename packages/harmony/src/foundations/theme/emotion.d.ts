import '@emotion/react'
import type { HarmonyTheme } from './theme'

declare module '@emotion/react' {
  export interface Theme extends HarmonyTheme {}
}
