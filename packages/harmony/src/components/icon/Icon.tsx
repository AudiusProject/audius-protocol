import type { ComponentType, SVGProps } from 'react'

import cn from 'classnames'

import type { ColorValue } from 'types/colors'
import { toCSSVariableName } from 'utils/styles'

import styles from './Icon.module.css'

type IconSize =
  | '2xs' // 12
  | 'xs' // 14
  | 's' // 16
  | 'm' // 20
  | 'l' // 24
  | 'xl' // 30
  | '2xl' // 32
  | '3xl' // 40

type IconProps = {
  color?: ColorValue
  size?: IconSize
} & SVGProps<SVGSVGElement>

export type IconComponent = ComponentType<IconProps>

/**
 * Renders a harmony Icon component
 */
export const Icon = (props: IconProps) => {
  const {
    className,
    color,
    children,
    size = 'l',
    style: styleProp,
    ...iconProps
  } = props

  const style = color
    ? {
        ...styleProp,
        '--icon-color': `var(${toCSSVariableName(color)})`
      }
    : styleProp

  const childProps = {
    ...iconProps,
    className: cn(
      styles.icon,
      { [styles.iconColor]: color },
      styles[size],
      className
    ),
    style
  }

  return <svg {...childProps}>{children}</svg>
}
