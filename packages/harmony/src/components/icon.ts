import type { ComponentType, SVGProps } from 'react'

import { IconSize } from 'foundations/spacing'

import type { IconColors } from '../foundations/color/semantic'
import type { ShadowOptions } from '../foundations/shadows'

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
