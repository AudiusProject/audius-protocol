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

  /** Background Color */
  backgroundColor: BackgroundColorValue

  /** Border */
  border?: BorderOptions
  /** Border Radius */
  borderRadius?: CornerRadiusOptions
  /** Show border or not */
  showBorder?: boolean

  /** Elevation Shadow */
  shadow?: ShadowOptions
}
