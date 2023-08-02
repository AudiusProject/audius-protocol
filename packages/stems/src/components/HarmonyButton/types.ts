import { ReactNode } from 'react'

import { IconComponent } from 'components/Icons/types'
import { ColorValue } from 'styles/colors'
import { BaseButtonProps } from 'utils/types'

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

export type HarmonyButtonProps = {
  /**
   * Override the color of the button, only valid for the `PRIMARY` variant
   */
  color?: ColorValue
  /**
   * The text of the button
   */
  text: ReactNode

  /**
   * The type of the button
   */
  variant?: HarmonyButtonType

  /**
   * The button size
   */
  size?: HarmonyButtonSize

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
} & BaseButtonProps
