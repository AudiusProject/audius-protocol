import type { CSSProperties } from 'react'

import type {
  BorderRadiusValue,
  BorderValue,
  ShadowValue,
  SpacingValue
} from 'styles/types'

export type BoxProps = {
  /** Height */
  h?: CSSProperties['height']
  /** Width */
  w?: CSSProperties['width']

  /** Padding */
  p?: SpacingValue | number
  /** Padding Horizontal */
  ph?: SpacingValue | number
  /** Padding Vertical */
  pv?: SpacingValue | number
  /** Padding Top */
  pt?: SpacingValue | number
  /** Padding Left */
  pl?: SpacingValue | number
  /** Padding Right */
  pr?: SpacingValue | number
  /** Padding Bottom */
  pb?: SpacingValue | number

  /** Margin */
  m?: SpacingValue | number
  /** Margin Horizontal */
  mh?: SpacingValue | number
  /** Margin Vertical */
  mv?: SpacingValue | number
  /** Margin Top */
  mt?: SpacingValue | number
  /** Margin Left */
  ml?: SpacingValue | number
  /** Margin Right */
  mr?: SpacingValue | number
  /** Margin Bottom */
  mb?: SpacingValue | number

  /** Border */
  border?: BorderValue
  /** Border Radius */
  borderRadius?: BorderRadiusValue

  /** Elevation Shadow */
  shadow?: ShadowValue
}
