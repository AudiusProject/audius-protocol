import type { ComponentType, SVGProps } from 'react'

import type { IconColors } from '../foundations/color/semantic'
import type { ShadowOptions } from '../foundations/shadows'
import { iconSizes } from '../foundations/spacing'

type IconSize = keyof typeof iconSizes

type SVGBaseProps = SVGProps<SVGSVGElement>

export type IconProps = {
  color?: IconColors
  size?: IconSize
  sizeW?: IconSize
  sizeH?: IconSize
  height?: number
  width?: number
  shadow?: ShadowOptions
}

type SVGIconProps = SVGBaseProps & IconProps

export type IconComponent = ComponentType<SVGBaseProps | SVGIconProps>
