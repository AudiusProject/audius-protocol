import { HTMLAttributes, ReactNode } from 'react'
import * as React from 'react'

export type IconButtonProps = HTMLAttributes<HTMLButtonElement> & {
  onClick?: (event: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  isActive?: boolean
  activeClassName?: string
  icon: ReactNode
  /** Aria label must be provided for an icon button as icons have no text */
  'aria-label': string
}
