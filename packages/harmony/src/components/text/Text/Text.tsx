import { ElementType, ForwardedRef, forwardRef } from 'react'

import { useTheme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'

import { typography } from '../../../foundations/typography'

import { variantStylesMap, variantTagMap } from './constants'
import type { TextProps } from './types'

export const Text = forwardRef(
  <TextComponentType extends ElementType = 'p'>(
    props: TextProps<TextComponentType>,
    ref: ForwardedRef<TextComponentType>
  ) => {
    const {
      children,
      variant,
      strength = 'default',
      size = 'm',
      color,
      shadow,
      tag,
      asChild,
      textAlign,
      ...other
    } = props

    const theme = useTheme()

    const variantConfig = variant && variantStylesMap[variant]
    const styles = {
      fontFamily: `'Avenir Next LT Pro', 'Helvetica Neue', Helvetica,
    Arial, sans-serif`,
      position: 'relative',
      boxSizing: 'border-box',
      ...(color &&
        color === 'heading' && {
          // inline is necessary to prevent text clipping
          display: 'inline',
          color: theme.color.secondary.secondary,
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundImage: theme.color.text.heading
        }),
      ...(color && color !== 'heading' && { color: theme.color.text[color] }),
      ...(variantConfig && {
        // @ts-ignore
        fontSize: typography.size[variantConfig.fontSize[size]],
        // @ts-ignore
        lineHeight: typography.lineHeight[variantConfig.lineHeight[size]],
        // @ts-ignore
        fontWeight: typography.weight[variantConfig.fontWeight[strength]],
        ...('css' in variantConfig && variantConfig.css),
        ...(shadow && {
          textShadow: typography.shadow[shadow]
        }),
        textAlign
      })
    }

    // @ts-ignore
    const variantTag = variant && variantTagMap[variant]?.[size]

    const Tag: ElementType = asChild ? Slot : tag ?? variantTag ?? 'p'

    return (
      <Tag ref={ref} css={styles} {...other}>
        {children}
      </Tag>
    )
  }
)
