import type { ComponentPropsWithoutRef } from 'react'

import { css } from '@emotion/native'
import Color from 'color'

import type { SpecialColors, IconComponent } from '@audius/harmony-native'
import { useTheme } from 'app/harmony-native/foundations/theme'

import { Text } from '../Text/Text'
import { Flex } from '../layout/Flex/Flex'

export type MusicBadgeVariant = 'default' | 'accent'

export type MusicBadgeSize = 's' | 'm'

export type MusicBadgeProps = {
  /**
   * The type of the MusicBadge
   */
  variant?: MusicBadgeVariant
  /**
   * The icon to display in the left of the MusicBadge
   */
  icon?: IconComponent
  /**
   * Override the colors of the MusicBadge
   */
  color?: SpecialColors
} & ComponentPropsWithoutRef<'div'>

export const MusicBadge = (props: MusicBadgeProps) => {
  const { variant = 'default', icon: Icon, color: colorProp, children } = props
  const { color } = useTheme()

  const backgroundColor = colorProp
    ? color.special[colorProp]
    : variant === 'default'
    ? color.background.default
    : color.background.accent
  const textColor = colorProp
    ? (color.special[colorProp] as string)
    : variant === 'default'
    ? color.text.default
    : color.text.accent
  const iconColor = colorProp
    ? (color.special[colorProp] as string)
    : variant === 'default'
    ? color.icon.default
    : color.icon.accent
  const borderColor = colorProp
    ? Color(color.special[colorProp]).fade(0.5).toString()
    : variant === 'default'
    ? color.border.strong
    : color.border.accent

  return (
    <Flex
      direction='row'
      alignItems='center'
      justifyContent='center'
      borderRadius='s'
      border='strong'
      gap='xs'
      ph='s'
      pv='xs'
      style={css({
        backgroundColor: Color(backgroundColor).fade(0.92).toString(),
        borderColor
      })}
    >
      {Icon ? <Icon size='s' fill={iconColor} /> : null}
      <Text
        variant='label'
        size='s'
        // Hack - should not have to explicitly  set lineHeight, but there's a bug
        // that adds extra margins to demibold + bold text variants.
        style={css({ color: textColor, lineHeight: 16 })}
      >
        {children}
      </Text>
    </Flex>
  )
}
