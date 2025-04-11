import { ReactNode } from 'react'

import { Origin } from '../popup/types'

export type HoverCardProps = {
  /**
   * Content displayed as the hover trigger
   */
  children: ReactNode

  /**
   * Content displayed inside the hover card
   */
  content: ReactNode

  /**
   * Optional CSS class name
   */
  className?: string

  /**
   * Callback fired when the hover card is closed
   */
  onClose?: () => void

  /**
   * Callback fired when the hover card is clicked
   */
  onClick?: () => void

  /**
   * Position of the anchor origin
   * @default { horizontal: 'right', vertical: 'center' }
   */
  anchorOrigin?: Origin

  /**
   * Position of the transform origin
   * @default { horizontal: 'left', vertical: 'center' }
   */
  transformOrigin?: Origin
}

export type BaseHoverCardHeaderProps = {
  /**
   * The icon or component to display on the left side of the header
   */
  icon: ReactNode
  /**
   * The title to display in the header
   */
  title: string
  /**
   * Optional callback when the close button is clicked
   */
  onClose?: () => void
}
