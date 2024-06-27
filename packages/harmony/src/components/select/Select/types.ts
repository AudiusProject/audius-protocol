import { IconComponent } from 'components/icon'
import { Origin } from 'components/popup/types'

import { SelectInputProps } from '../SelectInput/types'

export type SelectOption = {
  value: string
  /**
   * The label to display. If not provided, uses the value.
   */
  label?: string
  helperText?: string
  icon?: IconComponent
  leadingElement?: JSX.Element
}

export type SelectPopupProps = {
  /**
   * Popup anchor origin
   * @default { horizontal: 'left', vertical: 'bottom' }
   */
  popupAnchorOrigin?: Origin

  /**
   * Popup max height
   */
  popupMaxHeight?: number

  /**
   * Popup transform origin
   * @default { horizontal: 'left', vertical: 'top' }
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

export type SelectProps = {
  /**
   * Placeholder text for the filter input
   */
  filterInputPlaceholder?: string

  /**
   * Selection options
   * e.g. { label: 'Option A', icon: IconRadar }
   */
  options: SelectOption[]

  /**
   * Label to display above options
   */
  optionsLabel?: string

  /**
   * The selected value
   */
  selection?: string | null
} & SelectPopupProps &
  Omit<SelectInputProps, 'children' | 'value'>
