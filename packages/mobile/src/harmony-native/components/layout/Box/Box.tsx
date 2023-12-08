import styled from '@emotion/native'

import type { BoxProps } from './types'

export const Box = styled.View<BoxProps>(
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
    alignSelf,
    flex,
    theme
  }) => {
    const { spacing, color, cornerRadius, shadows } = theme
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
      ...(shadow && {
        ...shadows[shadow],
        // In order for shadows to work on iOS they need a background color
        // Using white as a default here, but can be overridden
        backgroundColor: color.background.white
      }),
      paddingTop: padT && spacing[padT],
      paddingLeft: padL && spacing[padL],
      paddingRight: padR && spacing[padR],
      paddingBottom: padB && spacing[padB],
      marginTop: marginT && spacing[marginT],
      marginLeft: marginL && spacing[marginL],
      marginRight: marginR && spacing[marginR],
      marginBottom: marginB && spacing[marginB],
      // Native doesn't have a border:"" shorthand
      ...(border && {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: color.border[border]
      }),
      ...(borderTop && {
        borderStyle: 'solid',
        borderTopWidth: 1,
        borderTopColor: color.border[borderTop]
      }),
      ...(borderRight && {
        borderStyle: 'solid',
        borderRightWidth: 1,
        borderRightColor: color.border[borderRight]
      }),
      ...(borderBottom && {
        borderStyle: 'solid',
        borderBottomWidth: 1,
        borderBottomColor: color.border[borderBottom]
      }),
      ...(borderLeft && {
        borderStyle: 'solid',
        borderLeftWidth: 1,
        borderLeftColor: color.border[borderLeft]
      }),
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
