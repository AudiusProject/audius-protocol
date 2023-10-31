import { ElementType, ForwardedRef, forwardRef } from 'react'

import { Slot } from '@radix-ui/react-slot'
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
      asChild,
      ...other
    } = props

    const Tag: ElementType = asChild
      ? Slot
      : tag ?? variantTagMap[variant ?? 'body'][size] ?? 'p'

    const variantClassNames = [
      variant || '',
      variant ? camelCase(`${variant} ${size}`) : '',
      variant ? camelCase(`${variant} ${strength}`) : '',
      color ? camelCase(`color ${color}`) : ''
    ].map((cn) => styles[cn])

    return (
      <Tag
        ref={innerRef ?? ref}
        className={cn(styles.text, ...variantClassNames, className)}
        {...other}
      >
        {children}
      </Tag>
    )
  }
)
