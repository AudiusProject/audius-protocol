import { ComponentPropsWithoutRef, ReactNode } from 'react'

export type NotificationCountProps = {
  /**
   * The notification count to display
   */
  count?: number
  /**
   * The size of the notification count.
   * @default undefined
   */
  size?: 's'
  /**
   * Whether the parent item is selected
   */
  isSelected?: boolean
  children?: ReactNode
} & ComponentPropsWithoutRef<'div'>
