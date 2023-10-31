import type { CSSProperties } from 'react'

import type { SpacingOptions } from 'foundations/spacing'

import type { BoxProps } from '../Box'

export type FlexProps = {
  alignItems?: CSSProperties['alignItems']
  direction?: CSSProperties['flexDirection']
  gap?: SpacingOptions
  justifyContent?: CSSProperties['justifyContent']
  wrap?: CSSProperties['flexWrap']
} & BoxProps
