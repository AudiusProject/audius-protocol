import { ReactNode } from 'react'

import { TextInputProps } from '../../input/TextInput'

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
  handleChange: (value: string, label: string) => void
  /**
   * A ref to the anchor element (button)
   */
  anchorRef: React.RefObject<HTMLInputElement>
}

export type SelectInputProps = Omit<TextInputProps, 'children' | 'value'> & {
  /**
   * Children render prop. This can be used to render the dropdown component
   */
  children?: (props: ChildrenProps) => ReactNode

  /**
   * The value
   */
  value?: string | null

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
}
