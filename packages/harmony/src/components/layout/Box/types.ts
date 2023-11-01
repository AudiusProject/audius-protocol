import type { CSSProperties } from 'react'

import type { BorderOptions } from 'foundations/color'
import type { CornerRadiusOptions } from 'foundations/corner-radius'
import type { ShadowOptions } from 'foundations/shadows'
import type { SpacingOptions } from 'foundations/spacing'

export type BoxProps = {
  /** Height */
  h?: CSSProperties['height']
  /** Width */
  w?: CSSProperties['width']

  /** Padding */
  p?: SpacingOptions
  /** Padding Horizontal */
  ph?: SpacingOptions
  /** Padding Vertical */
  pv?: SpacingOptions
  /** Padding Top */
  pt?: SpacingOptions
  /** Padding Left */
  pl?: SpacingOptions
  /** Padding Right */
  pr?: SpacingOptions
  /** Padding Bottom */
  pb?: SpacingOptions

  /** Margin */
  m?: SpacingOptions
  /** Margin Horizontal */
  mh?: SpacingOptions
  /** Margin Vertical */
  mv?: SpacingOptions
  /** Margin Top */
  mt?: SpacingOptions
  /** Margin Left */
  ml?: SpacingOptions
  /** Margin Right */
  mr?: SpacingOptions
  /** Margin Bottom */
  mb?: SpacingOptions

  /** Border */
  border?: BorderOptions
  /** Border Radius */
  borderRadius?: CornerRadiusOptions

  /** Elevation Shadow */
  shadow?: ShadowOptions

  flex?: CSSProperties['flex']
  alignSelf?: CSSProperties['alignSelf']
}
