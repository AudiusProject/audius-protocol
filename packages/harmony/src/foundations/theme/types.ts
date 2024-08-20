import { Interpolation } from '@emotion/react'

import { HarmonyTheme } from './theme'

export type Theme = 'day' | 'dark' | 'matrix'

export type WithCSS<T> = T & { css?: Interpolation<HarmonyTheme> }
