import React from 'react'

import { Nullable, Maybe } from '@audius/common/utils'
import { TooltipPlacement } from 'antd/lib/tooltip'

import { ThemeColor } from 'utils/theme/theme'

export type TooltipProps = {
  children: React.ReactNode
  className?: string
  // Color from theme
  color?: ThemeColor
  // determines if it should display.
  disabled?: boolean
  // Where the tooltip gets mounted.
  mount?: 'parent' | 'page' | 'body'
  // Whether the tooltip should have a custom container/mount.
  // Takes precedence over `mount`
  getPopupContainer?: () => Maybe<Nullable<ParentNode>>
  mouseEnterDelay?: number
  mouseLeaveDelay?: number
  placement?: TooltipPlacement
  // Should the tooltip go away when clicking on the underlying element?
  shouldDismissOnClick?: boolean
  // Whether there is a fixed max width, causing content to wrap onto the next line.
  shouldWrapContent?: boolean
  // Text to appear in tooltip
  text?: React.ReactNode
}
