import React, { useRef, useState, useEffect } from 'react'

import clsx from 'clsx'
import ReactDOM from 'react-dom'

import styles from './Tooltip.module.css'

export enum Position {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right'
}

const TooltipText: React.FC<{
  text: string
  className: string
  style?: object
}> = ({ text, style, className }) => (
  <div className={clsx(className, styles.tooltipContent)} style={style}>
    <div className={styles.tooltipContainer}>
      <div className={styles.tooltipContainerReal}>
        <div className={styles.tooltipText}>
          {text}
          <div className={styles.arrow} />
        </div>
      </div>
    </div>
  </div>
)

interface TooltipProps {
  className?: string
  text: string
  onClick?: (e: React.MouseEvent) => void
  isDisabled?: boolean
  position?: Position
}

function offset(el: any) {
  const rect = el.getBoundingClientRect()
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  return {
    top: rect.top + scrollTop,
    left: rect.left + rect.width / 2 + scrollLeft
  }
}

const Tooltip: React.FC<TooltipProps> = ({
  className,
  children,
  text,
  onClick = () => {},
  isDisabled = false,
  position = Position.TOP
}) => {
  const containerRef = useRef(null)
  const [tooltipPosition, setPosition] = useState({ left: 0, top: 0 })
  const rootDomNode = document.getElementById('root') as any
  const [isHover, setHover] = useState(false)

  const getPostition = () => {
    return offset(containerRef.current)
  }

  const tooltip = (
    <TooltipText
      text={text}
      className={clsx({
        [styles.tooltipLeft]: position === Position.LEFT,
        [styles.tooltipRight]: position === Position.RIGHT,
        [styles.tooltipTop]: position === Position.TOP,
        [styles.tooltipBottom]: position === Position.BOTTOM
      })}
      style={{
        top: `${tooltipPosition.top - 16}px`,
        left: `${tooltipPosition.left}px`
      }}
    />
  )

  useEffect(() => {
    if (isHover) {
      const tooltipPosition = getPostition()
      setPosition(tooltipPosition)
    }
  }, [isHover])

  useEffect(() => {
    const hideOnScroll = () => {
      setHover(false)
    }
    window.addEventListener('scroll', hideOnScroll, true)
    return () => window.removeEventListener('scroll', hideOnScroll)
  }, [isHover])

  if (isDisabled) {
    return <> {children} </>
  }

  return (
    <span
      ref={containerRef}
      className={clsx(styles.tooltipContainer, { [className!]: !!className })}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {isHover ? ReactDOM.createPortal(tooltip, rootDomNode) : null}
      {children}
    </span>
  )
}

export default Tooltip
