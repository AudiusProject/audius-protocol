import type { CSSProperties } from 'react'

import type { BackgroundColors, BorderColors } from 'foundations'
import type { CornerRadiusOptions } from 'foundations/corner-radius'
import type { ShadowOptions } from 'foundations/shadows'

export type PaperProps = {
  /** Height */
  h?: CSSProperties['height']
  /** Width */
  w?: CSSProperties['width']

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
  shadow?: ShadowOptions
}
