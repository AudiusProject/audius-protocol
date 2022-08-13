import React from 'react'

import { TooltipPlacement } from 'antd/lib/tooltip'

export type TooltipProps = {
  children: React.ReactNode
  // Background color can be changed by overriding
  // `--tooltip-background-color` CSS variable
  className?: string
  // Color from theme
  // Use getThemeColors to pass in a theme color
  color?: string
  // determines if it should display.
  disabled?: boolean
  // Where the tooltip gets mounted.
  mount?: 'parent' | 'page' | 'body'
  // Whether the tooltip should have a custom container/mount.
  // Takes precedence over `mount`
  getPopupContainer?: () => React.ReactNode
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
