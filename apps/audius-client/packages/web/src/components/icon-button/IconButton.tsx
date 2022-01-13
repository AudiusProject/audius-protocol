import React, { forwardRef, ReactNode } from 'react'

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

// TODO: sk - this should use the Button component from Stems

// A button that is just an icon, no text.
const IconButton = forwardRef(
  (
    {
      onClick,
      className,
      isActive,
      activeClassName,
      icon,
      disabled = false
    }: IconButtonProps,
    ref?: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <button
        className={cn(
          styles.container,
          className,
          { [activeClassName || '']: isActive },
          { [styles.disabled]: disabled }
        )}
        ref={ref}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </button>
    )
  }
)

export default IconButton
