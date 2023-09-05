import { PopupProps } from '../Popup'

type ApplicablePopupProps = Pick<
  PopupProps,
  'position' | 'title' | 'zIndex' | 'containerRef'
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
    triggerPopup: () => void
  ) => React.ReactNode | Element
} & ApplicablePopupProps

export type PopupMenuItem = {
  /**
   * An optional className to apply to the item
   */
  className?: string

  /**
   * An optional icon to display with the menu item
   */
  icon?: React.ReactNode | Element

  /**
   * An optional className to apply to the icon
   */
  iconClassName?: string

  /**
   * A function triggered when the menu item is clicked
   */
  onClick: () => void

  /**
   * The text of the menu item
   */
  text: string | React.ReactNode | Element
}
