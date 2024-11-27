import { ElementType, ForwardedRef, forwardRef, useContext } from 'react'

import { useTheme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'

import { bodyLineHeightMap, variantStylesMap, variantTagMap } from './constants'
import { TextContext } from './textContext'
import type { TextProps } from './types'

export const Text = forwardRef(
  <TextComponentType extends ElementType = 'p'>(
    props: TextProps<TextComponentType>,
    ref: ForwardedRef<TextComponentType>
  ) => {
    const {
      children,
      variant: variantProp,
      strength: strengthProp,
      size: sizeProp,
      color,
      shadow,
      tag,
      asChild,
      textAlign,
      textTransform,
      ellipses,
      maxLines,
      lineHeight,
      ...other
    } = props

    const theme = useTheme()
    const { variant: contextVariant } = useContext(TextContext)
    const variant = variantProp ?? contextVariant ?? 'body'
    const parentVariant = contextVariant && !variantProp
    const strength = strengthProp ?? (parentVariant ? undefined : 'default')
    const size = sizeProp ?? (parentVariant ? undefined : 'm')

    const variantConfig = variant && variantStylesMap[variant]
    const css = {
      fontFamily: theme.typography.font,
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
        fontSize: theme.typography.size[variantConfig.fontSize[size]],

        lineHeight:
          // @ts-ignore
          theme.typography.lineHeight[
            lineHeight && variant === 'body' && size
              ? // @ts-ignore
                bodyLineHeightMap[size][lineHeight]
              : // @ts-ignore
                variantConfig.lineHeight[size]
          ],
        // @ts-ignore
        fontWeight: theme.typography.weight[variantConfig.fontWeight[strength]],
        ...('css' in variantConfig && variantConfig.css),
        ...(lineHeight === 'multi' && {
          wordBreak: 'break-word',
          hyphens: 'auto'
        })
      }),
      ...(shadow && {
        textShadow: theme.typography.shadow[shadow]
      }),
      textAlign,
      ...(textTransform && { textTransform }),
      ...(ellipses && {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }),
      ...(maxLines && {
        overflow: 'hidden',
        display: '-webkit-box',
        lineClamp: `${maxLines}`,
        WebkitLineClamp: `${maxLines}`,
        WebkitBoxOrient: 'vertical'
      })
    }

    // @ts-ignore
    const variantTag = variant && variantTagMap[variant]?.[size]

    const Tag: ElementType = asChild ? Slot : tag ?? variantTag ?? 'span'

    const textElement = (
      <Tag ref={ref} css={css} {...other}>
        {children}
      </Tag>
    )

    if (parentVariant) {
      return textElement
    }

    return (
      <TextContext.Provider value={{ variant }}>
        {textElement}
      </TextContext.Provider>
    )
  }
)
