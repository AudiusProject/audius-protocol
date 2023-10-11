import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import type { IconComponent } from '../../components/typography/Icons/types'
import type { ColorValue } from '../../types/colors'

export enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DESTRUCTIVE = 'destructive',
  DESTRUCTIVE_SECONDARY = 'destructive_secondary'
}

export enum ButtonSize {
  SMALL = 'small',
  DEFAULT = 'default',
  LARGE = 'large'
}

type BaseButtonStyles = {
  button: string
  text: string
  icon: string
}

export type HTMLButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
>

export type BaseButtonProps = {
  /**
   * The text of the button
   */
  text?: string

  /**
   * Optional icon element to include on the left side of the button
   */
  iconLeft?: IconComponent

  /**
   * Optional icon element to include on the right side of the button
   */
  iconRight?: IconComponent

  /**
   * The max width at which text will still be shown
   */
  widthToHideText?: number

  /**
   * Optional min width
   * Min width can be useful if the button is switching states and you want
   * to keep a certain width while text length changes
   */
  minWidth?: number

  /**
   * If provided, allow button to take up full width of container
   */
  fullWidth?: boolean

  /**
   * Internal styling used by derived button components
   */
  styles: BaseButtonStyles
} & HTMLButtonProps

export type ButtonProps = {
  /**
   * Override the color of the button, only valid for the `PRIMARY` variant
   */
  color?: ColorValue

  /**
   * Override the color of the button using any hex color, only valid for the `PRIMARY` variant
   */
  hexColor?: `#${string}`

  /**
   * The type of the button
   */
  variant?: ButtonType

  /**
   * The button size
   */
  size?: ButtonSize
} & Omit<BaseButtonProps, 'styles'>

export enum PlainButtonType {
  DEFAULT = 'default',
  SUBDUED = 'subdued',
  INVERTED = 'inverted'
}

export enum PlainButtonSize {
  DEFAULT = 'default',
  LARGE = 'large'
}

export type PlainButtonProps = {
  /**
   * The type of the button
   */
  variant?: PlainButtonType

  /**
   * The button size
   */
  size?: PlainButtonSize
} & Omit<BaseButtonProps, 'styles'>
