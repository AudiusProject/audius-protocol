import { useState, useCallback } from 'react'

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

type CollapsibleContentProps = {
  id: string
  className?: string
  toggleButtonClassName?: string
  showByDefault?: boolean
  collapsedHeight?: number
  showText: string
  hideText: string
  children: React.ReactNode
}

export const CollapsibleContent = ({
  id,
  className,
  toggleButtonClassName,
  showByDefault = false,
  collapsedHeight = 0,
  showText,
  hideText,
  children
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
