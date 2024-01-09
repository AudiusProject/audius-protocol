import type { ReactNode } from 'react'

import type { SpecialColors } from '@audius/harmony'
import type { PressableProps, TextStyle, ViewProps } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

import type { LoadingSpinnerProps } from 'app/components/loading-spinner/LoadingSpinner'
import type { Icon, IconProps } from 'app/harmony-native/icons'

import type { TextProps } from '../Text/Text'

type BaseButtonStyles = {
  text?: TextStyle
  icon?: IconProps['style']
}

type BaseButtonInnerProps = {
  button?: ViewProps
  text?: TextProps
  icon?: IconProps
  loader?: LoadingSpinnerProps
}

export enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DESTRUCTIVE = 'destructive'
}

export enum ButtonSize {
  SMALL = 'small',
  DEFAULT = 'default',
  LARGE = 'large'
}

export type BaseButtonProps = {
  /**
   * Optional icon element to include on the left side of the button
   */
  iconLeft?: Icon

  /**
   * Optional icon element to include on the right side of the button
   */
  iconRight?: Icon

  /**
   * When true, do not override icon's fill colors
   */
  isStaticIcon?: boolean

  /**
   * Show a spinning loading state instead of the left icon
   */
  isLoading?: boolean

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
   * Internal styles used by derived button components
   */
  styles?: BaseButtonStyles

  /**
   * Internal props used by derived button components
   */
  innerProps?: BaseButtonInnerProps

  /**
   * reanimated sharedValue to apply additional animated styles
   */
  sharedValue?: SharedValue<number>

  children?: ReactNode
} & PressableProps

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
