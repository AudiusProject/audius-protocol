import { useTheme } from '@emotion/react'

import type { IconComponent } from 'components/icon'
import { SpecialColors } from 'foundations'
import { hexToRgba } from 'utils/colorUtils'

import { Flex } from '../layout/Flex'
import { Text } from '../text/Text'

export enum MusicBadgeVariant {
  DEFAULT = 'default',
  ACCENT = 'accent'
}

export enum MusicBadgeSize {
  SMALL = 's',
  DEFAULT = 'm'
}

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
    variant = MusicBadgeVariant.DEFAULT,
    textLabel,
    icon: Icon,
    size = MusicBadgeSize.DEFAULT,
    color: colorProp
  } = props
  const { color } = useTheme()

  const gap = size === MusicBadgeSize.DEFAULT ? 's' : 'xs'
  const height = size === MusicBadgeSize.DEFAULT ? '2xl' : 'xl'
  const backgroundColor =
    colorProp ||
    (variant === MusicBadgeVariant.DEFAULT
      ? color.background.default
      : color.background.accent)
  const textColor =
    colorProp ||
    (variant === MusicBadgeVariant.DEFAULT
      ? color.text.default
      : color.text.accent)
  const iconColor =
    colorProp ||
    (variant === MusicBadgeVariant.DEFAULT
      ? color.icon.default
      : color.icon.accent)
  const borderColor = colorProp
    ? hexToRgba(colorProp, 0.5)
    : color.border.strong

  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      borderRadius='s'
      border='strong'
      gap={gap}
      h={height}
      ph={size}
      css={{
        backgroundColor: hexToRgba(backgroundColor, 0.08),
        borderColor
      }}
    >
      {Icon ? <Icon size={size} fill={iconColor} /> : null}
      <Text
        variant='label'
        size={size}
        textTransform='uppercase'
        css={{
          color: textColor
        }}
      >
        {textLabel}
      </Text>
    </Flex>
  )
}
