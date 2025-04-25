import { useState, useCallback, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'

import {
  PlainButton,
  IconCaretDown as IconCaretDownLine,
  IconCaretUp as IconCaretUpLine,
  useTheme
} from '@audius/harmony'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import useMeasure from 'react-use-measure'

import styles from './CollapsibleContent.module.css'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

type CollapsibleContentProps = {
  id: string
  className?: string
  toggleButtonClassName?: string
  showByDefault?: boolean
  collapsedHeight?: number
  showText?: string
  hideText?: string
  children: ReactNode
  onHeightChange?: (height: number) => void
}

export const CollapsibleContent = ({
  id,
  className,
  toggleButtonClassName,
  showByDefault = false,
  collapsedHeight = 0,
  showText = messages.seeMore,
  hideText = messages.seeLess,
  children,
  onHeightChange
}: CollapsibleContentProps) => {
  const [isCollapsed, setIsCollapsed] = useState(!showByDefault)
  const { spacing } = useTheme()

  const handleToggle = useCallback(() => {
    setIsCollapsed((isCollapsed) => !isCollapsed)
  }, [setIsCollapsed])

  const [ref, bounds] = useMeasure({
    polyfill: ResizeObserver,
    offsetSize: true
  })

  useLayoutEffect(() => {
    const buttonHeight = 48 // Height of the toggle button
    const totalHeight =
      (isCollapsed ? collapsedHeight : bounds.height) + buttonHeight
    onHeightChange?.(totalHeight)
  }, [bounds.height, isCollapsed, collapsedHeight, onHeightChange])

  return (
    <div className={cn(className, { collapsed: isCollapsed })}>
      <div
        id={id}
        className={styles.collapsibleContainer}
        style={{ height: isCollapsed ? collapsedHeight : bounds.height }}
      >
        <div ref={ref}>{children}</div>
      </div>
      <PlainButton
        className={cn(styles.toggleCollapsedButton, toggleButtonClassName)}
        css={{
          paddingTop: spacing.l,
          paddingBottom: spacing.l,
          margin: '0 auto'
        }}
        aria-controls={id}
        aria-expanded={!isCollapsed}
        iconRight={isCollapsed ? IconCaretDownLine : IconCaretUpLine}
        onClick={handleToggle}
        variant='subdued'
      >
        {isCollapsed ? showText : hideText}
      </PlainButton>
    </div>
  )
}
