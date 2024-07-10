import { IconComponent } from 'components/icon'
import { Origin } from 'components/popup/types'

import { FilterButtonProps } from '../FilterButton/types'

export type OptionsFilterButtonOption = {
  value: string
  /**
   * The label to display. If not provided, uses the value.
   */
  label?: string
  helperText?: string
  icon?: IconComponent
  /**
   * A leading element to display before the option label. Useful for icons/emojis
   */
  leadingElement?: JSX.Element
  /**
   * A leading element to display before the filter button label
   */
  labelLeadingElement?: JSX.Element
}

export type FilterButtonPopupProps = {
  /**
   * Popup anchor origin
   * @default { horizontal: 'center', vertical: 'bottom' }
   */
  popupAnchorOrigin?: Origin

  /**
   * Popup max height
   */
  popupMaxHeight?: number

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

export type OptionsFilterButtonProps = {
  /**
   * Selection options
   * e.g. { label: 'Option A', icon: IconRadar }
   */
  options: OptionsFilterButtonOption[]

  /**
   * Label to display above options
   */
  optionsLabel?: string

  /**
   * The selected value
   */
  selection?: string | null

  /**
   * Show a text input to filter the options
   */
  showFilterInput?: boolean

  /**
   * Placeholder text for the filter input
   */
  filterInputPlaceholder?: string
} & FilterButtonPopupProps &
  Omit<FilterButtonProps, 'children' | 'value'>
