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
  p?: SpacingValue
  /** Padding Horizontal */
  ph?: SpacingValue
  /** Padding Vertical */
  pv?: SpacingValue
  /** Padding Top */
  pt?: SpacingValue
  /** Padding Left */
  pl?: SpacingValue
  /** Padding Right */
  pr?: SpacingValue
  /** Padding Bottom */
  pb?: SpacingValue

  /** Margin */
  m?: SpacingValue
  /** Margin Horizontal */
  mh?: SpacingValue
  /** Margin Vertical */
  mv?: SpacingValue
  /** Margin Top */
  mt?: SpacingValue
  /** Margin Left */
  ml?: SpacingValue
  /** Margin Right */
  mr?: SpacingValue
  /** Margin Bottom */
  mb?: SpacingValue

  /** Border */
  border?: BorderValue
  /** Border Radius */
  borderRadius?: BorderRadiusValue

  /** Elevation Shadow */
  shadow?: ShadowValue

  flex?: CSSProperties['flex']
}
