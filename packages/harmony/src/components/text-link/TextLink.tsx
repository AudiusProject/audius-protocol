import { useTheme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'

import { Text } from 'components/text/Text'

import type { TextLinkProps } from './types'

/**
 * Also known as hyperlinks, these are words or phrases that can be clicked to navigate to a linked webpage.
 */
export const TextLink = (props: TextLinkProps) => {
  const {
    asChild = false,
    children,
    variant = 'default',
    isExternal = false,
    onClick,
    textVariant,
    showUnderline,
    ...other
  } = props

  const { color } = useTheme()

  const variantColors = {
    default: color.link.default,
    visible: color.link.visible,
    inverted: color.static.white
  }

  const variantHoverColors = {
    default: color.primary.p300,
    visible: color.link.visible,
    inverted: color.static.white
  }

  const hoverStyles = {
    textDecoration: 'underline',
    color: variantHoverColors[variant]
  }

  return (
    <Text
      asChild
      onClick={onClick}
      tag='a'
      css={{
        color: variantColors[variant],
        textDecoration: 'none',
        ':hover': hoverStyles,
        ...(showUnderline && hoverStyles)
      }}
      variant={textVariant}
      {...other}
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
