import { useTheme } from '@emotion/react'

import type { IconComponent } from 'components/icon'
import { SpecialColors } from 'foundations'
import { hexToRgba } from 'utils/colorUtils'

import { Flex } from '../layout/Flex'
import { Text } from '../text/Text'

export type MusicBadgeVariant = 'default' | 'accent'

export type MusicBadgeSize = 's' | 'm'

export type MusicBadgeProps = {
  /**
   * The text label to display in the MusicBadge
   */
  textLabel: string
  /**
   * The type of the MusicBadge
   */
  variant?: MusicBadgeVariant
  /**
   * The icon to display in the left of the MusicBadge
   */
  icon?: IconComponent
  /**
   * The size of the MusicBadge
   */
  size?: 's' | 'm'
  /**
   * Override the colors of the MusicBadge
   */
  color?: SpecialColors
}

export const MusicBadge = (props: MusicBadgeProps) => {
  const {
    variant = 'default',
    textLabel,
    icon: Icon,
    size = 'm',
    color: colorProp
  } = props
  const { color } = useTheme()

  const gap = size === 'm' ? 's' : 'xs'
  const height = size === 'm' ? '2xl' : 'xl'
  const backgroundColor = colorProp
    ? color.special[colorProp]
    : variant === 'default'
    ? color.background.default
    : color.background.accent
  const textColor =
    colorProp ||
    (variant === 'default' ? color.text.default : color.text.accent)
  const iconColor =
    colorProp ||
    (variant === 'default' ? color.icon.default : color.icon.accent)
  const borderColor = colorProp
    ? hexToRgba(color.special[colorProp], 0.5)
    : variant === 'default'
    ? color.border.strong
    : color.icon.accent // Hacky - should there be a color.border.accent?

  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      borderRadius='s'
      border='strong'
      gap={gap}
      h={height}
      ph={size}
      css={{ backgroundColor: hexToRgba(backgroundColor, 0.08), borderColor }}
    >
      {Icon ? <Icon size={size} fill={iconColor} /> : null}
      <Text variant='label' size={size} css={{ color: textColor }}>
        {textLabel}
      </Text>
    </Flex>
  )
}
