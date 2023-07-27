import React from 'react'

import { ColorValue, toCSSVariableName } from '@audius/stems'
import cn from 'classnames'

import styles from './Icon.module.css'

type IconSize =
  | 'xSmall' // 14
  | 'small' // 16
  | 'medium' // 20
  | 'large' // 24
  | 'xLarge' // 30
  | 'xxLarge' // 32

type IconProps = {
  color?: ColorValue
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  size?: IconSize
} & React.SVGProps<SVGSVGElement>

/** Renders a stems Icon component
 * Ex: `<Icon icon={IconKebabHorizontal} color='accentGreen' />`
 * Use `size` to render one of the standard sizes:
 * - xSmall: 14
 * - small: 16
 * - medium: 20
 * - large: 24
 * - xLarge: 30
 * - xxLarge: 32
 */
export const Icon = ({
  color,
  icon: IconComponent,
  size = 'small',
  style,
  ...iconProps
}: IconProps) => {
  const finalStyle = color
    ? {
        ...style,
        '--icon-color': toCSSVariableName(color)
      }
    : style
  return (
    <IconComponent
      className={cn(styles.icon, styles[size])}
      style={finalStyle}
      {...iconProps}
    />
  )
}
