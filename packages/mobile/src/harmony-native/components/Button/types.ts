import type { ReactNode } from 'react'

import type { PressableProps, StyleProp, ViewStyle } from 'react-native/types'

import type { Icon } from 'app/harmony-native/icons'

type BaseButtonStyles = {
  button?: StyleProp<ViewStyle>
  icon?: StyleProp<ViewStyle>
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
   * Internal styling used by derived button components
   */
  styles?: BaseButtonStyles

  /**
   * Native styling for the pressable component
   */
  style?: ViewStyle

  /**
   * Child elements
   */
  children?: ReactNode
} & Omit<PressableProps, 'children' | 'style'>
