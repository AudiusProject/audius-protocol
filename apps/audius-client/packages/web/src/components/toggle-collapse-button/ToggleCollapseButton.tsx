import { useState, useCallback } from 'react'

import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import useMeasure from 'react-use-measure'

import { ReactComponent as IconCaretDownLine } from 'assets/img/iconCaretDownLine.svg'
import { ReactComponent as IconCaretUpLine } from 'assets/img/iconCaretUpLine.svg'

import styles from './ToggleCollapseButton.module.css'

type ToggleCollapseButtonProps = {
  id: string
  className?: string
  toggleButtonClassName?: string
  showByDefault?: boolean
  collapsedHeight?: number
  showText: string
  hideText: string
  children: React.ReactNode
}

export const ToggleCollapseButton = ({
  id,
  className,
  toggleButtonClassName,
  showByDefault = false,
  collapsedHeight = 0,
  showText,
  hideText,
  children
}: ToggleCollapseButtonProps) => {
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
        className={styles.toggleCollapsedContentsContainer}
        style={{ height: isCollapsed ? collapsedHeight : bounds.height }}
      >
        <div ref={ref} className={styles.toggleCollapsedContents}>
          {children}
        </div>
      </div>
      <button
        className={cn(styles.toggleCollapsedButton, toggleButtonClassName)}
        aria-controls={id}
        aria-expanded={!isCollapsed}
        onClick={handleToggle}
      >
        <span>{isCollapsed ? showText : hideText}</span>
        {isCollapsed ? <IconCaretDownLine /> : <IconCaretUpLine />}
      </button>
    </div>
  )
}
