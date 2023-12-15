import type { ComponentPropsWithoutRef } from 'react'

import type { CSSObject } from '@emotion/react'

import type { Origin } from 'components/layout/Popup/types'
import type { SpecialColors } from 'foundations/color'

import type { IconComponent } from '../icon'

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

type BaseButtonStyles = {
  button: CSSObject
  icon: CSSObject
}

export type HTMLButtonProps = ComponentPropsWithoutRef<'button'>

/**
 * These props should only be used for dev purposes, whether in debug mode,
 * or to show various states in storybook.
 * */
type InternalProps = {
  /**
   * @ignore: This prop is for internal use only
   */
  _isHovered?: boolean
  /**
   * @ignore: This prop is for internal use only
   */
  _isPressed?: boolean
}

export type BaseButtonProps = {
  /**
   * Optional icon element to include on the left side of the button
   */
  iconLeft?: IconComponent

  /**
   * Optional icon element to include on the right side of the button
   */
  iconRight?: IconComponent

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
  styles: BaseButtonStyles

  /**
   * Change the default rendered element for the one passed as a child,
   *  merging their props and behavior.
   */
  asChild?: boolean
} & HTMLButtonProps &
  InternalProps

export type ButtonProps = {
  /**
   * Override the color of the button, only valid for the `PRIMARY` variant
   */
  color?: SpecialColors

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

export enum FilterButtonSize {
  DEFAULT = 'default',
  SMALL = 'small'
}

export enum FilterButtonType {
  /**
   * The container is filled with solid color after selection
   */
  FILL_CONTAINER = 'fillContainer',

  /**
   * The label is used as the selected value
   */
  REPLACE_LABEL = 'replaceLabel'
}

export type FilterButtonOption = {
  value: string
  label?: string
  icon?: IconComponent
}

export type FilterButtonProps = {
  /**
   * Selection options
   * e.g. { label: 'Option A', icon: IconRadar }
   */
  options: FilterButtonOption[]

  /**
   * The text that appears on the button component.
   * If no label is provided, a different Icon can be specified
   * to contextually inform users.
   */
  label?: string

  /**
   * If no label is provided, specify an optional aria-label
   */
  'aria-label'?: string

  /**
   * The currently selected value
   */
  selectedValue?: string | null

  /**
   * The button size
   * @default FilterButtonSize.DEFAULT
   */
  size?: FilterButtonSize

  /**
   * The type of filter button
   * @default FilterButtonType.FILL_CONTAINER
   */
  variant?: FilterButtonType

  /**
   * Optional icon element to include on the left side of the button
   */
  iconLeft?: IconComponent

  /**
   * Optional icon element to include on the right side of the button
   */
  iconRight?: IconComponent

  /**
   * What to do when an option is selected
   */
  onSelect?: (label: string) => void

  /**
   * Popup anchor origin
   * @default { horizontal: 'center', vertical: 'bottom' }
   */
  popupAnchorOrigin?: Origin

  /**
   * Popup transform origin
   * @default { horizontal: 'center', vertical: 'top' }
   */
  popupTransformOrigin?: Origin

  /**
   * Popup portal location passed to the inner popup
   */
  popupPortalLocation?: HTMLElement

  /**
   * zIndex applied to the inner Popup component
   */
  popupZIndex?: number
}
