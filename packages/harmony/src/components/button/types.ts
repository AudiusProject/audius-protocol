import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import type { IconComponent } from 'components/icon/types'
import type { ColorValue } from 'types/colors'

export enum HarmonyButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DESTRUCTIVE = 'destructive',
  GHOST = 'ghost'
}

export enum HarmonyButtonSize {
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
  text: ReactNode

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

export type HarmonyButtonProps = {
  /**
   * Override the color of the button, only valid for the `PRIMARY` variant
   */
  color?: ColorValue

  /**
   * The type of the button
   */
  variant?: HarmonyButtonType

  /**
   * The button size
   */
  size?: HarmonyButtonSize
} & Omit<BaseButtonProps, 'styles'>

export enum HarmonyPlainButtonType {
  DEFAULT = 'default',
  SUBDUED = 'subdued',
  INVERTED = 'inverted'
}

export enum HarmonyPlainButtonSize {
  DEFAULT = 'default',
  LARGE = 'large'
}

export type HarmonyPlainButtonProps = {
  /**
   * The type of the button
   */
  variant?: HarmonyPlainButtonType

  /**
   * The button size
   */
  size?: HarmonyPlainButtonSize
} & Omit<BaseButtonProps, 'styles'>
