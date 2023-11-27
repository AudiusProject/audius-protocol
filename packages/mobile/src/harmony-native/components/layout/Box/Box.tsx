import type { BoxProps } from '@audius/harmony'
import styled from '@emotion/native'
import type { FlexStyle } from 'react-native'

type NativeBoxProps = Omit<BoxProps, 'alignSelf'> & {
  flex?: number
  alignSelf?: FlexStyle['alignSelf']
}
export const Box = styled.View<NativeBoxProps>(
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
    alignSelf,
    flex,
    shadow,
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
