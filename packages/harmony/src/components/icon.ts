import type { ComponentType, SVGProps } from 'react'

import type { IconColors } from 'foundations'

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
