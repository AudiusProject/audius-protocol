import styled from '@emotion/styled'

import type { BoxProps } from './types'

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
      paddingTop: padT && `var(--harmony-spacing-${padT})`,
      paddingLeft: padL && `var(--harmony-spacing-${padL})`,
      paddingRight: padR && `var(--harmony-spacing-${padR})`,
      paddingBottom: padB && `var(--harmony-spacing-${padB})`,
      marginTop: marginT && `var(--harmony-spacing-${marginT})`,
      marginLeft: marginL && `var(--harmony-spacing-${marginL})`,
      marginRight: marginR && `var(--harmony-spacing-${marginR})`,
      marginBottom: marginB && `var(--harmony-spacing-${marginB})`,
      border: border && `1px solid var(--harmony-border-${border})`,
      borderRadius:
        borderRadius && `var(--harmony-border-radius-${borderRadius})`
    }
  }
)
