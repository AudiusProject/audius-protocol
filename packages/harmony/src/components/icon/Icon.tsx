import type { ComponentType, SVGProps } from 'react'

import { useTheme } from '@emotion/react'

import type { IconColors } from 'foundations/color'

export const iconSizes = {
  xs: 14,
  s: 16,
  m: 20,
  l: 24,
  xl: 30,
  '2xl': 32
}

type IconSize = keyof typeof iconSizes

type BaseIconProps = SVGProps<SVGSVGElement>

type IconProps = BaseIconProps & {
  color?: IconColors
  size?: IconSize
}

export type IconComponent = ComponentType<BaseIconProps | IconProps>

/**
 * Renders a harmony Icon component
 */
export const Icon = (props: IconProps) => {
  const { color, children, size, ...other } = props

  const theme = useTheme()
  const iconSize = size ? iconSizes[size] : undefined
  const iconColor = color ? theme.color.icon[color] : undefined

  return (
    <svg
      css={[
        iconSize && {
          height: iconSize,
          width: iconSize,
          minWidth: iconSize
        },
        iconColor && { path: { fill: iconColor } }
      ]}
      {...other}
    >
      {children}
    </svg>
  )
}
