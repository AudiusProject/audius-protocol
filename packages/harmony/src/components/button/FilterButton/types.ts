import { ReactNode } from 'react'

import { IconComponent } from 'components/icon'

export type FilterButtonSize = 'default' | 'small'

// TODO: is replaceLabel still needed?
export type FilterButtonVariant = 'fillContainer' | 'replaceLabel'

export type FilterButtonOption = {
  value: string
  /**
   * The label to display. If not provided, uses the value.
   */
  label?: string
  icon?: IconComponent
}

type ChildrenProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  handleChange: (value: string, label: string) => void
  anchorRef: React.RefObject<HTMLButtonElement>
}

export type FilterButtonProps = {
  children: (props: ChildrenProps) => ReactNode

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
   * The value
   */
  value?: string | null

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
   * What to do when the value is changed
   */
  onChange?: (value: string) => void

  /**
   * Whether interaction is disabled
   */
  disabled?: boolean
}
