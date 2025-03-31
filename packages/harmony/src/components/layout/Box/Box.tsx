import styled from '@emotion/styled'

import type { SpacingOptions } from '../../../foundations/spacing'

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
    backgroundColor,
    border,
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    borderRadius,
    borderTopRightRadius,
    borderBottomRightRadius,
    borderBottomLeftRadius,
    borderTopLeftRadius,
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
      height: spacing[h as SpacingOptions] ?? h,
      width: spacing[w as SpacingOptions] ?? w,
      boxShadow: shadow && shadows[shadow],
      paddingTop: (padT && spacing[padT as SpacingOptions]) ?? padT,
      paddingLeft: (padL && spacing[padL as SpacingOptions]) ?? padL,
      paddingRight: (padR && spacing[padR as SpacingOptions]) ?? padR,
      paddingBottom: (padB && spacing[padB as SpacingOptions]) ?? padB,
      marginTop: (marginT && spacing[marginT as SpacingOptions]) ?? marginT,
      marginLeft: (marginL && spacing[marginL as SpacingOptions]) ?? marginL,
      marginRight: (marginR && spacing[marginR as SpacingOptions]) ?? marginR,
      marginBottom: (marginB && spacing[marginB as SpacingOptions]) ?? marginB,
      backgroundColor:
        backgroundColor &&
        (backgroundColor === 'none'
          ? undefined
          : theme.color.background[backgroundColor]),
      border: border && `1px solid ${color.border[border]}`,
      borderTop: borderTop && `1px solid ${color.border[borderTop]}`,
      borderRight: borderRight && `1px solid ${color.border[borderRight]}`,
      borderBottom: borderBottom && `1px solid ${color.border[borderBottom]}`,
      borderLeft: borderLeft && `1px solid ${color.border[borderLeft]}`,
      borderRadius: borderRadius && cornerRadius[borderRadius],
      borderTopRightRadius:
        borderTopRightRadius && cornerRadius[borderTopRightRadius],
      borderBottomRightRadius:
        borderBottomRightRadius && cornerRadius[borderBottomRightRadius],
      borderBottomLeftRadius:
        borderBottomLeftRadius && cornerRadius[borderBottomLeftRadius],
      borderTopLeftRadius:
        borderTopLeftRadius && cornerRadius[borderTopLeftRadius],
      flex,
      alignSelf
    }
  }
)
