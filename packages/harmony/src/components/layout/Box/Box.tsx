import styled from '@emotion/styled'

import type { BoxProps } from './types'

/** Base layout component used as a building block for creating pages and other components. */
export const Box = styled.div<BoxProps>(
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
    shadow,
    flex,
    alignSelf,
    theme
  }) => {
    const { shadows, spacing, color, cornerRadius } = theme
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
      boxShadow: shadow && shadows[shadow],
      paddingTop: padT && spacing[padT],
      paddingLeft: padL && spacing[padL],
      paddingRight: padR && spacing[padR],
      paddingBottom: padB && spacing[padB],
      marginTop: marginT && spacing[marginT],
      marginLeft: marginL && spacing[marginL],
      marginRight: marginR && spacing[marginR],
      marginBottom: marginB && spacing[marginB],
      border: border && `1px solid ${color.border[border]}`,
      borderRadius: borderRadius && cornerRadius[borderRadius],
      flex,
      alignSelf
    }
  }
)
