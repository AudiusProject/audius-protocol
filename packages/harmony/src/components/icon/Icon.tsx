import type { ComponentType, SVGProps } from 'react'

import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'

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
  sizeW?: IconSize
  sizeH?: IconSize
}

export type IconComponent = ComponentType<BaseIconProps | IconProps>

/**
 * Renders a harmony Icon component
 */
export const Icon = styled.svg<IconProps>((props) => {
  const { color, size, sizeH, sizeW } = props

  const theme = useTheme()
  const iconSize = size ? iconSizes[size] : undefined
  const iconSizeW = sizeH ? iconSizes[sizeH] : undefined
  const iconSizeH = sizeW ? iconSizes[sizeW] : undefined
  const iconColor = color ? theme.color.icon[color] : undefined

  return {
    ...(iconSize && {
      height: iconSizeW ?? iconSize,
      width: iconSizeH ?? iconSize,
      minWidth: iconSizeH ?? iconSize
    }),
    ...(iconColor && { path: { fill: iconColor } })
  }
})
