import '@emotion/react'
import type { HarmonyNativeTheme } from '@audius/harmony-native'

declare module '@emotion/react' {
  export interface Theme extends HarmonyNativeTheme {}
}
