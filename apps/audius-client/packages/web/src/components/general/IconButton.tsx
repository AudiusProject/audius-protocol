import React, { ReactNode } from 'react'
import cn from 'classnames'

import styles from './IconButton.module.css'

type IconButtonProps = {
  onClick?: (event: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  isActive?: boolean
  activeClassName?: string
  icon: ReactNode
}

// A button that is just an icon, no text.
const IconButton = ({
  onClick,
  className,
  isActive,
  activeClassName,
  icon,
  disabled = false
}: IconButtonProps) => {
  return (
    <div
      className={cn(
        styles.container,
        className,
        { [activeClassName || '']: isActive },
        { [styles.diabled]: disabled }
      )}
      onClick={onClick || undefined}
    >
      {icon}
    </div>
  )
}

export default IconButton
