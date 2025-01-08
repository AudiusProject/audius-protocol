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
  size?: 's' | 'm'
  /**
   * Whether the parent item is selected
   */
  isSelected?: boolean
  /**
   * Whether to display a border around the notification dot
   * @default false
   */
  hasBorder?: boolean
  children?: ReactNode
} & ComponentPropsWithoutRef<'div'>
