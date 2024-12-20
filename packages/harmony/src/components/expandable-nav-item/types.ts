import type { ReactNode } from 'react'

import type { WithCSS } from '../../foundations/theme'
import type { IconComponent } from '../icon'

export type ExpandableNavItemProps = WithCSS<{
  /** The label text of the navigation item. */
  children: React.ReactNode
  /** The icon component to display on the left side of the label. */
  leftIcon?: IconComponent
  /** Optional ReactNode to render on the right */
  rightIcon?: ReactNode
  /** Whether the folder is open by default. */
  defaultIsOpen?: boolean
  /** Nested items to render when the folder is open. */
  nestedItems?: React.ReactNode
}>
