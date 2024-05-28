import type { ReactNode } from 'react'
import { BorderColors } from '../../../foundations/color'

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical'
  children?: ReactNode
  className?: string
  color?: BorderColors
}
