import { ComponentProps, ElementType, ReactNode } from 'react'

import {
  ColorValue,
  CSSCustomProperties,
  toCSSVariableName
} from '@audius/stems'
import cn from 'classnames'
import { camelCase } from 'lodash'

import { variantTagMap } from './constants'
import { TextVariant, TextSize, TextStrength } from './types'
import styles from './typography.module.css'

type TextOwnProps<TextComponentType extends ElementType = 'span'> = {
  as?: TextComponentType
  className?: string
  children?: ReactNode
  variant?: TextVariant
  size?: TextSize
  strength?: TextStrength
  color?: ColorValue
}

export type TextProps<TextComponentType extends ElementType> =
  TextOwnProps<TextComponentType> &
    Omit<ComponentProps<TextComponentType>, keyof TextOwnProps>

export const Text = <TextComponentType extends ElementType = 'span'>(
  props: TextProps<TextComponentType>
) => {
  const {
    className,
    children,
    variant = 'body',
    strength = 'default',
    size = 'medium',
    color = 'neutral',
    as,
    ...otherProps
  } = props

  const Tag: ElementType = as ?? variantTagMap[variant][size] ?? 'p'

  const styleObject: CSSCustomProperties = {
    '--text-color': `var(${toCSSVariableName(color)})`
  }

  type TextClass = keyof typeof styles
  const variantClassNames = [
    variant as TextClass,
    camelCase(`${variant} ${size}`) as TextClass,
    camelCase(`${variant} ${strength}`) as TextClass
  ].map((cn) => styles[cn])

  return (
    <Tag
      className={cn(styles.root, ...variantClassNames, className)}
      style={styleObject}
      {...otherProps}
    >
      {children}
    </Tag>
  )
}
