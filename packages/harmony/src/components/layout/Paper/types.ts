import type { BackgroundColors, BorderColors } from 'foundations'
import type { CornerRadiusOptions } from 'foundations/corner-radius'
import type { ShadowOptions } from 'foundations/shadows'

import type { FlexProps } from '../Flex/types'

export type PaperProps = Omit<FlexProps, 'shadow'> & {
  /**
   * Background Color
   * @default default
   */
  backgroundColor?: BackgroundColors

  /**
   * Border type. If not provided, no border will be used.
   * @default default
   */
  border?: BorderColors

  /**
   * Border Radius
   * @default m
   */
  borderRadius?: CornerRadiusOptions

  /**
   * Elevation Shadow
   * @default mid
   */
  shadow?: Exclude<ShadowOptions, 'drop'>
}
