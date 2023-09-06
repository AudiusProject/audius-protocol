import { ComponentProps, MouseEvent } from 'react'

import { PopupProps } from '../Popup'

type ApplicablePopupProps = Pick<
  PopupProps,
  | 'position'
  | 'title'
  | 'titleClassName'
  | 'hideCloseButton'
  | 'zIndex'
  | 'containerRef'
  | 'transformOrigin'
  | 'anchorOrigin'
>

export type PopupMenuProps = {
  /**
   * The items to display in the menu
   */
  items: PopupMenuItem[]

  /**
   * A callback triggered when the menu is closed
   */
  onClose?: () => void

  /**
   * A render function that will be provided:
   * - An anchorRef for positioning the menu
   * - A triggerPopup function that will show/hide the popup
   */
  renderTrigger: (
    anchorRef: React.MutableRefObject<any>,
    triggerPopup: () => void,
    triggerProps: Partial<ComponentProps<'button'>>
  ) => React.ReactNode
  /**
   * Providing an id is necessary for proper a11y
   */
  id?: string
} & ApplicablePopupProps

export type PopupMenuItem = {
  /**
   * An optional className to apply to the item
   */
  className?: string

  /**
   * An optional icon to display with the menu item
   */
  icon?: React.ReactNode

  /**
   * An optional className to apply to the icon
   */
  iconClassName?: string

  /**
   * A function triggered when the menu item is clicked
   */
  onClick: (event: MouseEvent<HTMLLIElement>) => void

  /**
   * The text of the menu item
   */
  text: string | React.ReactNode
}
