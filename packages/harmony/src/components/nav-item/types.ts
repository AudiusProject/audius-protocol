import { MouseEvent, ReactNode } from 'react'

import { WithCSS } from '../../foundations'
import { IconComponent } from '../icon'
import { FlexProps } from '../layout'
import { TextSize } from '../text'

export type NavItemProps = WithCSS<{
  /** The label text of the navigation item. */
  children: ReactNode
  /** The name of the icon to display on the left side of the label. */
  leftIcon?: IconComponent
  /** The name of the icon to display on the right side of the label. */
  rightIcon?: ReactNode
  /** Whether the navigation item is currently selected. */
  isSelected?: boolean
  /** The callback function to be called when the navigation item is clicked. */
  onClick?: (event?: MouseEvent<Element>) => void
  /** The size of the text to display. */
  textSize?: TextSize
  /** Whether the navigation item has a notification count. */
  hasNotification?: boolean
}> &
  FlexProps
