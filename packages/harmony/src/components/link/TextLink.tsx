import { MouseEvent, useCallback } from 'react'

import { useTheme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'

import { Text } from 'components/text/Text'

import type { TextLinkProps } from './types'

/**
 * Also known as hyperlinks, these are words or phrases that can be clicked to navigate to a linked webpage.
 */
export const TextLink = (props: TextLinkProps) => {
  const {
    _isHovered = false,
    asChild = false,
    children,
    variant = 'default',
    stopPropagation = true,
    isExternal = false,
    onClick,
    ...passthroughProps
  } = props

  const { color } = useTheme()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      onClick?.(e)
      if (stopPropagation) {
        e.stopPropagation()
      }
    },
    [onClick, stopPropagation]
  )

  const colorByVariant = {
    default: color.primary.p500,
    subdued: color.text.default,
    inverted: color.static.white
  }

  const hoverStyles = {
    textDecoration: 'underline',
    ...(variant === 'subdued' && { color: color.primary.p300 })
  }

  return (
    <Text
      asChild
      onClick={handleClick}
      css={{
        color: colorByVariant[variant],
        textDecoration: _isHovered ? 'underline' : 'none',
        ':hover': hoverStyles,
        ...(_isHovered && hoverStyles)
      }}
      {...passthroughProps}
    >
      {asChild ? (
        <Slot>{children}</Slot>
      ) : (
        <a
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noreferrer' : undefined}
        >
          {children}
        </a>
      )}
    </Text>
  )
}
