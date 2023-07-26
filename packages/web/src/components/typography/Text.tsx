import { CSSProperties, ReactNode } from 'react'

import { getCurrentThemeColors, ThemeColor } from 'utils/theme/theme'

import { fontWeightMap, variantInfoMap, variantStrengthMap } from './constants'
import {
  TextSizeInfo,
  TextStrengthInfo,
  TextVariant,
  TextSize,
  TextStrength
} from './types'

const defaultBodyInfo: TextSizeInfo & TextStrengthInfo = {
  ...variantInfoMap.body.M!,
  ...variantStrengthMap.body.default!
}

export type TextProps = {
  className?: string
  children?: ReactNode
  variant?: TextVariant
  size?: TextSize
  strength?: TextStrength
  color?: ThemeColor
}

export const Text = (props: TextProps) => {
  const {
    className,
    children,
    variant = 'body',
    strength = 'default',
    size = 'M',
    color = '--neutral',
    ...otherProps
  } = props

  const themeColors = getCurrentThemeColors()
  const textColor = themeColors[color] ?? themeColors['--neutral']

  const variantSizeInfo = variantInfoMap[variant][size] ?? {}
  const variantStrengthInfo = variantStrengthMap[variant][strength] ?? {}

  const {
    tag: Tag,
    fontSize,
    lineHeight,
    letterSpacing,
    fontWeight,
    textTransform
  } = {
    ...defaultBodyInfo,
    ...variantSizeInfo,
    ...variantStrengthInfo
  }

  const styleObject: CSSProperties = {
    fontWeight: fontWeightMap[fontWeight].toString(),
    fontSize,
    lineHeight,
    letterSpacing,
    textTransform,
    color: textColor
  }

  return (
    <Tag className={className} style={styleObject} {...otherProps}>
      {children}
    </Tag>
  )
}
