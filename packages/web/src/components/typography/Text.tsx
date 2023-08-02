import { CSSProperties, ElementType, ReactNode } from 'react'

import cn from 'classnames'
import { camelCase } from 'lodash'

import { getCurrentThemeColors, ThemeColor } from 'utils/theme/theme'

import { variantTagMap } from './constants'
import { TextVariant, TextSize, TextStrength } from './types'
import styles from './typography.module.css'

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
    size = 'medium',
    color = '--neutral',
    ...otherProps
  } = props

  const Tag: ElementType = variantTagMap[variant][size] ?? 'p'

  const themeColors = getCurrentThemeColors()
  const textColor = themeColors[color] ?? themeColors['--neutral']
  const styleObject: CSSProperties = {
    color: textColor
  }

  type TextClass = keyof typeof styles
  const variantClassNames = [
    variant as TextClass,
    camelCase(`${variant} ${size}`) as TextClass,
    camelCase(`${variant} ${strength}`) as TextClass
  ].map((cn) => styles[cn])

  return (
    <Tag
      className={cn(...variantClassNames, className)}
      style={styleObject}
      {...otherProps}
    >
      {children}
    </Tag>
  )
}
