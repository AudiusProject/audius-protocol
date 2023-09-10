import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { ColorValue } from 'styles/colors'

export enum Type {
  PRIMARY = 'primary',
  PRIMARY_ALT = 'primaryAlt',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  COMMON = 'common',
  COMMON_ALT = 'commonAlt',
  DISABLED = 'disabled',
  GLASS = 'glass',
  WHITE = 'white',
  TEXT = 'text',
  DESTRUCTIVE = 'destructive'
}

export enum Size {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

type ButtonOwnProps<Component extends ElementType = 'button'> = {
  as?: Component
  color?: ColorValue
  /**
   * The text of the button
   */
  text: ReactNode

  /**
   * The type of the button
   */
  type?: Type

  /**
   * The default behavior of the button.
   */
  buttonType?: 'submit' | 'button' | 'reset'

  /**
   * The button size
   */
  size?: Size

  /**
   * Optional icon element to include on the left side of the button
   */
  leftIcon?: ReactNode | JSX.Element

  /**
   * Optional icon element to include on the right side of the button
   */
  rightIcon?: ReactNode | JSX.Element

  /**
   * Whether or not the button is clickable
   */
  isDisabled?: boolean

  /**
   * Whether or not to include animations on hover
   * Consider turning off animations in mobile-first experiences
   */
  includeHoverAnimations?: boolean

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
   * Class name to apply to the icon
   */
  iconClassName?: string

  /**
   * Class name to apply to the text label
   */
  textClassName?: string
}

export type ButtonProps<Component extends ElementType = 'button'> =
  ButtonOwnProps<Component> &
    Omit<ComponentPropsWithoutRef<Component>, keyof ButtonOwnProps>
