import type { CSSProperties } from 'react'

import type { SpacingValue } from 'styles/types'

import type { BoxProps } from '../Box'

export type FlexProps = {
  alignItems?: CSSProperties['alignItems']
  direction?: CSSProperties['flexDirection']
  gap?: SpacingValue
  justifyContent?: CSSProperties['justifyContent']
  wrap?: CSSProperties['flexWrap']
} & BoxProps
