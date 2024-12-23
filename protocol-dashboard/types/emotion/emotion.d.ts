import '@emotion/react'
import type { HarmonyTheme } from '@audius/harmony'

declare module '@emotion/react' {
  export interface Theme extends HarmonyTheme {}
}
