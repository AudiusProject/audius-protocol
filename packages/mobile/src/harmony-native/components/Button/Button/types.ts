import type { SpecialColors } from '@audius/harmony'

import type { BaseButtonProps } from '../BaseButton/types'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive'

export type ButtonSize = 'small' | 'default' | 'large'

export type ButtonProps = {
  /**
   * Override the color of the button, only valid for the `PRIMARY` variant
   */
  color?: Exclude<SpecialColors, 'gradient'>

  /**
   * Override the color of the button using any hex color, only valid for the `PRIMARY` variant
   */
  hexColor?: `#${string}`

  /**
   * The type of the button
   */
  variant?: ButtonVariant

  /**
   * The button size
   */
  size?: ButtonSize
} & Omit<BaseButtonProps, 'styles'>
