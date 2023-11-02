import type { CSSProperties } from 'react'

import type { BorderOptions } from 'foundations/color'
import type { CornerRadiusOptions } from 'foundations/corner-radius'
import type { ShadowOptions } from 'foundations/shadows'
import type { BackgroundColorValue } from 'types/colors'

export type PaperProps = {
  /** Height */
  h?: CSSProperties['height']
  /** Width */
  w?: CSSProperties['width']

  /**
   * Background Color
   * @default default
   */
  backgroundColor?: BackgroundColorValue

  /**
   * Border type. If not provided, no border will be used.
   * @default default
   */
  border?: BorderOptions

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
