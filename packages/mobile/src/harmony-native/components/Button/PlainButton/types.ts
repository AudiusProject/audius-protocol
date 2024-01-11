import type { BaseButtonProps } from '../BaseButton/types'

export type PlainButtonVariant = 'default' | 'subdued' | 'inverted'

export type PlainButtonSize = 'default' | 'large'

export type PlainButtonProps = {
  /**
   * The type of the button
   */
  variant?: PlainButtonVariant

  /**
   * The button size
   */
  size?: PlainButtonSize
} & Omit<BaseButtonProps, 'styles'>
