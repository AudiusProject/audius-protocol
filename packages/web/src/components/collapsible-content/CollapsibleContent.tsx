import { useState, useCallback } from 'react'

import {
  IconCaretDown as IconCaretDownLine,
  IconCaretUp as IconCaretUpLine
} from '@audius/harmony'
import { Button, ButtonSize, ButtonType } from '@audius/stems'
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
      <Button
        className={cn(styles.toggleCollapsedButton, toggleButtonClassName)}
        iconClassName={styles.toggleCollapsedButtonIcon}
        aria-controls={id}
        aria-expanded={!isCollapsed}
        type={ButtonType.TEXT}
        size={ButtonSize.SMALL}
        text={isCollapsed ? showText : hideText}
        rightIcon={isCollapsed ? <IconCaretDownLine /> : <IconCaretUpLine />}
        onClick={handleToggle}
      />
    </div>
  )
}
