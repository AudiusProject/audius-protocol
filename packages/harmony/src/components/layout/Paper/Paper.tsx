import styled from '@emotion/styled'

import { toCSSVariableName } from 'utils/styles'

import type { PaperProps } from './types'

/** Base layout component used as a building block for creating pages and other components. */
export const Paper = styled.div(
  ({
    h,
    w,
    backgroundColor = 'default',
    border = 'default',
    borderRadius = 'm',
    shadow = 'mid'
  }: PaperProps) => {
    return {
      position: 'relative',
      boxSizing: 'border-box',
      height: h,
      width: w,
      boxShadow: shadow && `var(--harmony-shadow-${shadow})`,
      border: border && `1px solid var(--harmony-border-${border})`,
      borderRadius:
        borderRadius && `var(--harmony-border-radius-${borderRadius})`,
      backgroundColor:
        backgroundColor && `var(${toCSSVariableName(`bg-${backgroundColor}`)})`
    }
  }
)
