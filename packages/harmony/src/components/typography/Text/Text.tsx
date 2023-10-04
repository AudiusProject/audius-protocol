import { ElementType, ForwardedRef, forwardRef } from 'react'

import cn from 'classnames'
import { camelCase } from 'lodash'

import { variantTagMap } from './constants'
import type { TextProps } from './types'
import styles from './typography.module.css'

export const Text = forwardRef(
  <TextComponentType extends ElementType = 'p'>(
    props: TextProps<TextComponentType>,
    ref: ForwardedRef<HTMLElement>
  ) => {
    const {
      className,
      children,
      variant,
      strength = 'default',
      size = 'm',
      color,
      tag,
      innerRef,
      style,
      ...otherProps
    } = props

    const Tag: ElementType =
      tag ?? variantTagMap[variant ?? 'body'][size] ?? 'p'

    type TextClass = keyof typeof styles
    const variantClassNames = [
      variant ? (variant as TextClass) : '',
      variant ? (camelCase(`${variant} ${size}`) as TextClass) : '',
      variant ? (camelCase(`${variant} ${strength}`) as TextClass) : '',
      color ? (camelCase(`color ${color}`) as TextClass) : ''
    ].map((cn) => styles[cn])

    return (
      <Tag
        ref={innerRef ?? ref}
        className={cn(...variantClassNames, className)}
        style={style}
        {...otherProps}
      >
        {children}
      </Tag>
    )
  }
)
