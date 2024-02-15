import { ComponentProps, MouseEvent } from 'react'

import { PopupProps } from '../layout/Popup'

type ApplicablePopupProps = Pick<
  PopupProps,
  | 'title'
  | 'className'
  | 'hideCloseButton'
  | 'zIndex'
  | 'containerRef'
  | 'transformOrigin'
  | 'anchorOrigin'
  | 'fixed'
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
   * An optional function that controls how the menu is rendered
   */
  renderMenu?: (menuItems: PopupMenuItem[]) => JSX.Element

  /**
   * Whether to dismiss the popup on mouse leave
   */
  dismissOnMouseLeave?: boolean

  /**
   * A render function that will be provided:
   * - An anchorRef for positioning the menu
   * - A triggerPopup function that will show/hide the popup
   */
  renderTrigger: (
    anchorRef: React.MutableRefObject<any>,
    triggerPopup: (onMouseEnter?: boolean) => void,
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
  onClick: (event: MouseEvent<HTMLElement>) => void

  /**
   * The text of the menu item
   */
  text: string | React.ReactNode

  /**
   * The optional description of the menu item
   */
  subtext?: string | React.ReactNode
}
