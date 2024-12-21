import '@emotion/react'
import type { HarmonyThemeV2 } from '@audius/harmony/src/foundations/theme/themeV2'

declare module '@emotion/react' {
  export interface Theme extends HarmonyThemeV2 {}
}