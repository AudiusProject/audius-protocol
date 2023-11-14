import { ElementType, ForwardedRef, forwardRef } from 'react'

import { CSSObject, useTheme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'

import { typography } from 'foundations'

import type { TextProps } from './types'

const variantTagMap = {
  display: {
    xl: 'h1',
    l: 'h1',
    m: 'h1',
    s: 'h1'
  },
  heading: {
    xl: 'h1',
    l: 'h2',
    m: 'h3',
    s: 'h4'
  }
}

export const variantStylesMap = {
  display: {
    fontSize: { s: '6xl', m: '7xl', l: '8xl', xl: '9xl' },
    lineHeight: { s: '3xl', m: '4xl', l: '5xl', xl: '6xl' },
    fontWeight: { default: 'bold', strong: 'heavy' }
  },
  heading: {
    fontSize: { s: 'xl', m: '2xl', l: '3xl', xl: '5xl' },
    lineHeight: { s: 'l', m: 'xl', l: 'xl', xl: '2xl' },
    fontWeight: { default: 'bold', strong: 'heavy' }
  },
  title: {
    fontSize: { xs: 'xs', s: 's', m: 'm', l: 'l' },
    lineHeight: { xs: 's', s: 's', m: 'm', l: 'l' },
    fontWeight: { weak: 'demiBold', default: 'bold', strong: 'heavy' }
  },
  label: {
    fontSize: { xs: '2xs', s: 'xs', m: 's', l: 'm', xl: 'xl' },
    lineHeight: { xs: 'xs', s: 'xs', m: 's', l: 's', xl: 'l' },
    fontWeight: { default: 'bold', strong: 'heavy' },
    css: { textTransform: 'uppercase' as const, letterSpacing: 0.5 }
  },
  body: {
    fontSize: { xs: 'xs', s: 's', m: 'm', l: 'l' },
    lineHeight: { xs: 's', s: 'm', m: 'm', l: 'l' },
    fontWeight: { default: 'medium', strong: 'demiBold' }
  }
}

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
      tag,
      asChild,
      ...other
    } = props

    const theme = useTheme()

    const variantConfig = variant && variantStylesMap[variant]
    const styles: CSSObject = {
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
        // @ts-expect-error
        fontSize: typography.size[variantConfig.fontSize[size]],
        // @ts-expect-error
        lineHeight: typography.lineHeight[variantConfig.lineHeight[size]],
        // @ts-expect-error
        fontWeight: typography.weight[variantConfig.fontWeight[strength]],
        ...('css' in variantConfig && variantConfig.css)
      })
    }

    // @ts-expect-error
    const variantTag = variant && variantTagMap[variant]?.[size]

    const Tag: ElementType = asChild ? Slot : tag ?? variantTag ?? 'p'

    return (
      <Tag ref={ref} css={styles} {...other}>
        {children}
      </Tag>
    )
  }
)
