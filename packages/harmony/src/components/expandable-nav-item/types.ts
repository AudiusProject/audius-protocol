import type { ReactNode } from 'react'

import type { WithCSS } from '../../foundations/theme'
import type { IconComponent } from '../icon'

export type ExpandableNavItemVariant = 'default' | 'compact'

export type VariantConfig = {
  textVariant: 'title' | 'body'
  textSize: 'l' | 's'
  textStrength: 'weak' | undefined
  iconSize: 'l' | 's'
  gap: 'm' | 'xs'
}

export type VariantConfigs = Record<ExpandableNavItemVariant, VariantConfig>

export type ExpandableNavItemProps = WithCSS<{
  /** The label text of the navigation item. */
  label: string
  /** The icon component to display on the left side of the label. */
  leftIcon?: IconComponent
  /** Optional ReactNode to render on the right */
  rightIcon?: ReactNode
  /** Whether the folder is open by default. */
  defaultIsOpen?: boolean
  /** Nested items to render when the folder is open. */
  nestedItems?: ReactNode
  /** Whether the right icon should persist regardless of the open state. */
  shouldPersistRightIcon?: boolean
  /** Whether the nav item can be unfurled. */
  canUnfurl?: boolean
  /** The variant of the nav item. */
  variant?: ExpandableNavItemVariant
  /** The onClick handler for the nav item. */
  onClick?: () => void
}>
