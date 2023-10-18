import styled from '@emotion/styled'

import type { BoxProps } from './types'

const getSpacingVar = (value: number | string) => {
  if (!isNaN(value)) {
    return `--harmony-unit-${value}`
  }
  return `--harmony-spacing-${value}`
}

/** Base layout component used as a building block for creating pages and other components. */
export const Box = styled.div(
  ({
    h,
    w,
    p,
    ph,
    pv,
    pt,
    pl,
    pr,
    pb,
    m,
    mh,
    mv,
    mt,
    ml,
    mr,
    mb,
    border,
    borderRadius,
    shadow
  }: BoxProps) => {
    const padT = pt ?? pv ?? p
    const padB = pb ?? pv ?? p
    const padL = pl ?? ph ?? p
    const padR = pr ?? ph ?? p

    const marginT = mt ?? mv ?? m
    const marginB = mb ?? mv ?? m
    const marginL = ml ?? mh ?? m
    const marginR = mr ?? mh ?? m

    return {
      position: 'relative',
      boxSizing: 'border-box',
      height: h,
      width: w,
      boxShadow: shadow && `var(--harmony-shadow-${shadow})`,
      paddingTop: padT && getSpacingVar(padT),
      paddingLeft: padL && getSpacingVar(padL),
      paddingRight: padR && getSpacingVar(padR),
      paddingBottom: padB && getSpacingVar(padB),
      marginTop: marginT && getSpacingVar(marginT),
      marginLeft: marginL && getSpacingVar(marginL),
      marginRight: marginR && getSpacingVar(marginR),
      marginBottom: marginB && getSpacingVar(marginB),
      border: border && `1px solid var(--harmony-border-${border})`,
      borderRadius:
        borderRadius && `var(--harmony-border-radius-${borderRadius})`
    }
  }
)
