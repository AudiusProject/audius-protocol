import { IconComponent } from 'components/icon'
import { Origin } from 'components/layout/Popup/types'

export type FilterButtonSize = 'default' | 'small'

export type FilterButtonVariant = 'fillContainer' | 'replaceLabel'

export type FilterButtonOption = {
  value: string
  /**
   * The label to display. If not provided, uses the value.
   */
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
   * The selected value
   */
  selection?: string

  /**
   * The button size
   * @default FilterButtonSize.DEFAULT
   */
  size?: FilterButtonSize

  /**
   * The type of filter button
   * @default FilterButtonType.FILL_CONTAINER
   */
  variant?: FilterButtonVariant

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
