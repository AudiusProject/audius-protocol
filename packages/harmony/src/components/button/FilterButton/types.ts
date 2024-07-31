import { ReactNode } from 'react'

import { IconComponent } from 'components/icon'

export type FilterButtonSize = 'default' | 'small'

export type FilterButtonVariant =
  | 'fillContainer' // When a value is present, the button will be in an active state and have a remove icon (default)
  | 'replaceLabel' // Shows the value as the label of the button, but doesn't show an active state

type ChildrenProps = {
  /**
   * State representing whether the FilterButton is open.
   * This can be used to implement a popup via `children`
   */
  isOpen: boolean
  /**
   * Set open state
   */
  setIsOpen: (isOpen: boolean) => void
  /**
   * A function to handle when the value is changed
   */
  handleChange: (value: string) => void
  /**
   * A ref to the anchor element (button)
   */
  anchorRef: React.RefObject<HTMLButtonElement>
}

export type FilterButtonProps = {
  /**
   * Children render prop. This can be used to render a dropdown component
   * for example
   */
  children?: (props: ChildrenProps) => ReactNode

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
   * @default 'fillContainer'
   */
  variant?: FilterButtonVariant

  /**
   * Optional icon element to include on the left side of the button
   */
  iconLeft?: IconComponent

  /**
   * Optional icon element to include on the right side of the button
   */
  iconRight?: IconComponent | null

  /**
   * What to do when the value is changed
   */
  onChange?: (value: string) => void

  /**
   * What to do when the filter button is opened
   */
  onOpen?: () => void

  /**
   * If provided, will be called when the selected value is reset
   */
  onReset?: () => void

  /**
   * What to do when the button is clicked
   * This will override the default behavior of toggling isOpen
   */
  onClick?: () => void

  /**
   * Whether interaction is disabled
   */
  disabled?: boolean

  /**
   * Optional leading element to include on the left side of the button
   */
  leadingElement?: ReactNode
}
