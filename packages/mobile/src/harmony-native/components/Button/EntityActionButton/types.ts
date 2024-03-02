import type { StyleProp, ViewStyle } from 'react-native'

import type { IconComponent, IconProps } from 'app/harmony-native/icons'

import type { BaseButtonProps } from '../BaseButton/types'

export type EntityActionButtonProps = {
  /**
   * The current state of the button
   */
  isActive?: boolean

  /**
   * Callback for when an action is triggered
   */
  onPress?: () => void

  /**
   * Optional icon element to include on the left side of the button
   */
  iconLeft?: IconComponent

  /**
   * Optional icon element to include on the right side of the button
   */
  iconRight?: IconComponent

  /**
   * Optional props to pass to the icon component
   */
  icon?: IconProps

  style?: StyleProp<ViewStyle>
} & Omit<BaseButtonProps, 'styles'>
