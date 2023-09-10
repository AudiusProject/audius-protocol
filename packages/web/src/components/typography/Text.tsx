import {
  ComponentProps,
  ElementType,
  ForwardedRef,
  forwardRef,
  ReactNode
} from 'react'

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
  component?: ElementType
  color?: ColorValue
  innerRef?: ForwardedRef<HTMLElement>
}

export type TextProps<TextComponentType extends ElementType = 'span'> =
  TextOwnProps<TextComponentType> &
    Omit<ComponentProps<TextComponentType>, keyof TextOwnProps>

export const Text = forwardRef(function Text<
  TextComponentType extends ElementType = 'span'
>(props: TextProps<TextComponentType>, ref: ForwardedRef<HTMLElement>) {
  const {
    className,
    children,
    variant = 'body',
    strength: strengthProp,
    size: sizeProp,
    color: colorProp,
    component,
    as,
    innerRef,
    style: styleProp,
    ...otherProps
  } = props

  const strength =
    strengthProp ?? (variant === 'inherit' ? undefined : 'default')

  const size = sizeProp ?? (variant === 'inherit' ? undefined : 'medium')
  const color = colorProp ?? (variant === 'inherit' ? undefined : 'neutral')

  const Tag: ElementType =
    as ?? component ?? (size ? variantTagMap[variant][size] ?? 'p' : 'p')

  const style: CSSCustomProperties = color
    ? {
        ...styleProp,
        '--text-color': `var(${toCSSVariableName(color)})`
      }
    : styleProp

  const rootClassName = color ? styles.root : undefined

  type TextClass = keyof typeof styles
  const variantClassNames = [
    variant as TextClass,
    camelCase(`${variant} ${size}`) as TextClass,
    camelCase(`${variant} ${strength}`) as TextClass
  ].map((cn) => styles[cn])

  return (
    <Tag
      ref={innerRef ?? ref}
      className={cn(rootClassName, ...variantClassNames, className)}
      style={style}
      {...otherProps}
    >
      {children}
    </Tag>
  )
})
