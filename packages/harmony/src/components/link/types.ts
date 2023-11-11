import type { AnchorHTMLAttributes, MouseEventHandler, ReactNode } from 'react'

export type TextLinkProps = {
  /**
   * Change the default rendered element for the one passed as a child,
   *  merging their props and behavior.
   */
  asChild?: boolean

  /**
   * The link destination.
   */
  href?: AnchorHTMLAttributes<HTMLAnchorElement>['href']

  /**
   * Which variant to display.
   * @default default
   */
  variant?: 'default' | 'subdued' | 'inverted'

  /**
   * If true, prevent the click event from being propagated to other elements.
   * @default true
   */
  stopPropagation?: boolean

  /**
   * A custom click handler if you don't want to link to another page directly.
   */
  onClick?: MouseEventHandler

  /**
   * Mark as true if the link destination is outside of the app. Causes the
   * link to open in a new tab.
   * @default false
   */
  isExternal?: boolean

  /**
   * The link text to be displayed.
   */
  children: ReactNode

  // Internal props

  /**
   * @ignore: This prop is for internal use only
   */
  _isHovered?: boolean
}
